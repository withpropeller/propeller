import {
    Customer,
    CustomerVerificationMinimumTier1,
    CustomerVerificationMinimumTier2,
} from '@api/customer/customer.schema';
import { CustomerService } from '@api/customer/customer.service';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { Repository, RepositoryFactory } from '@core/abstracts/repository';
import { AppException } from '@core/exceptions';
import { TenantDataSource, AppStatus, Utils, ObjectType } from '@core/helpers';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { Business } from '@models/business/business.schema';
import { BusinessService } from '@models/business/business.service';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AddDepositChannelDto, CreateAccountDto, GenerateStatementDto, RefreshDepositChannelDto } from './account.dto';
import {
    AccountCurrency,
    AccountStatus,
    AccountType,
    DepositChannelType,
    DepositaryCurrencies,
    VirtualAccountPartner,
} from './account.enums';
import { AccountException } from './account.exceptions';
import { Account, DepositChannel } from './accounts.schema';
import { AccountLog } from './account-logs.schema';
import { ShortTransactionMode, TransactionMode } from '@api/transactions/transactions.enums';
import { BusinessKYCService } from '@models/business/business-kyc.service';
import { EnvoyResponseCode, StaticEnvoyResponse } from './account.interface';
import { plainToInstance } from 'class-transformer';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';
import { Payment } from '@api/payments/payment.schema';
import { ExecutionOptions } from '@common/interfaces';
import { PaymentType } from '@api/payments/payment.enums';
import { ModelIdTag, ParseTagId, TagMongoId } from '@core/mongo';
import { getVACIntegration } from './account.utils';
import { Luhn } from '@common/helpers/luhn';
import { ConfigService } from '@config/config.service';
import { ReporterService } from '@core/services';
import { HttpService } from '@nestjs/axios';
import { BalanceService } from '@api/balance/balance.service';
import { BalanceStatementData, CreateAccountBalanceDto } from '@api/balance/balance.interface';
import { EnvoyEvent, EnvoyService } from '@common/envoy';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class AccountService {
    public repo: Repository<Account>;
    public logRepo: Repository<AccountLog>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private customerService: CustomerService,
        private businessService: BusinessService,
        private balanceService: BalanceService,
        private businessKYCService: BusinessKYCService,
        private envoy: EnvoyService,
        private config: ConfigService,
        private http: HttpService,
        private reporter: ReporterService,
    ) {
        const model = this.moduleRef.get(getModelToken(Account.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        const logModel = this.moduleRef.get(getModelToken(AccountLog.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Account>(model);
        this.logRepo = RepositoryFactory<AccountLog>(logModel);
    }

    public async create(businessId: Types.ObjectId, dto: CreateAccountDto, options?: ExecutionOptions) {
        const business = await this.businessService.safeGet(businessId, this.request);

        switch (dto.type) {
            case AccountType.Main:
                return this._createMainAccount(business, dto, options);
            case AccountType.Sub:
                return this._createSubAccount(business, dto, options);
            case AccountType.Virtual:
                return this._createVirtualAccount(business, dto, options);
            default:
                throw AccountException.InvalidAccountType;
        }
    }

    private async _createMainAccount(
        business: HydratedDocument<Business>,
        dto: CreateAccountDto,
        options?: ExecutionOptions,
    ) {
        // Create account
        const account = await this._createMainAccountEntity(business, dto, options);

        // Create balance
        const balanceData: CreateAccountBalanceDto = {
            currency: account.currency,
            account: account._id,
            business: business._id,
        };
        const balanceId = await this.balanceService.createAccountBalance(balanceData, options);
        await this.repo.updateById(account._id, { $set: { balance: balanceId } }, options);

        // Create Deposit Channel
        if (this._allowsDeposit(dto)) {
            const depositChannel = await this._createDepositChannel(
                dto.name,
                DepositChannelType.BankAccount,
                false,
                options,
            );
            await this.repo.updateById(account._id, { $push: { depositChannels: depositChannel } }, options);
        }

        return this.repo.findOneById(account._id);
    }

    private async _createSubAccount(
        business: HydratedDocument<Business>,
        dto: CreateAccountDto,
        options?: ExecutionOptions,
    ) {
        // get customer
        const customer = await this.customerService.safeGetCustomerByIdOrReference(business.id, dto.customer);

        // create account entity
        const account = await this._createSubAccountEntity(business, customer, dto, options);

        // create balance
        const balanceData: CreateAccountBalanceDto = {
            currency: account.currency,
            account: account._id,
            business: business._id,
        };
        const balance = await this.balanceService.createAccountBalance(balanceData, options);
        await this.repo.updateById(account._id, { $set: { balance: balance.id } }, options);

        // create deposit channel
        if (this._allowsDeposit(dto)) {
            const depositChannel = await this._createDepositChannel(
                dto.name,
                DepositChannelType.BankAccount,
                false,
                options,
            );
            await this.repo.updateById(account._id, { $set: { depositChannels: [depositChannel] } }, options);
        }

        return this.repo.findOneById(account._id);
    }

    private async _createVirtualAccount(
        business: HydratedDocument<Business>,
        dto: CreateAccountDto,
        options?: ExecutionOptions,
    ) {
        // get customer
        const customer = await this.customerService.safeGetCustomerByIdOrReference(business.id, dto.customer);

        // ensure verification
        await this.customerService.ensureVerification(customer, CustomerVerificationMinimumTier1);

        // create account entity
        const account = await this._createVirtualAccountEntity(business, dto, options);

        // create deposit channel
        const depositChannel = await this._createDedicatedDepositChannel(customer, options);

        // update account
        return this.repo.findOneAndUpdate(
            { _id: account._id },
            { $set: { depositChannels: [depositChannel] } },
            options,
        );
    }

    private async _createMainAccountEntity(
        business: HydratedDocument<Business>,
        dto?: CreateAccountDto,
        options?: ExecutionOptions,
    ) {
        const entity: Partial<Account> = Utils.removeNilValues({
            name: dto.name,
            type: dto.type,
            business: business.id,
            currency: dto.currency,
        });

        try {
            return this.repo.createAndSave(entity, options);
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable;
        }
    }

    private async _createSubAccountEntity(
        business: HydratedDocument<Business>,
        customer: HydratedDocument<Customer>,
        dto?: CreateAccountDto,
        options?: ExecutionOptions,
    ) {
        const entity: Partial<Account> = Utils.removeNilValues({
            name: dto.name,
            type: dto.type,
            business: business.id,
            currency: dto.currency,
            customer: customer.id,
        });

        try {
            return this.repo.createAndSave(entity, options);
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable;
        }
    }

    private async _createVirtualAccountEntity(
        business: HydratedDocument<Business>,
        dto: CreateAccountDto,
        options?: ExecutionOptions,
    ) {
        // get customer
        const customer = await this.customerService.safeGetCustomerByIdOrReference(business.id, dto.customer);

        // get settlement account
        let settlementAccount: HydratedDocument<Account>;
        if (dto.settlementAccount) {
            settlementAccount = await this.safeGet(business.id, dto.settlementAccount);
        } else {
            settlementAccount = await this.safeGetMainDefault(business.id, dto.currency);
        }

        const entity: Partial<Account> = Utils.removeNilValues({
            name: dto.name,
            type: dto.type,
            business: business.id,
            currency: dto.currency,
            customer: customer.id,
            settlementAccount: settlementAccount._id,
        });

        try {
            return this.repo.createAndSave(entity, options);
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable;
        }
    }

    async findByIdOrReference(businessId: Types.ObjectId, id: string, query?: APIPagingDto) {
        const entityId = ParseTagId(id, [ModelIdTag.Account]);

        if (entityId) {
            return this.repo.findOneWithOptions({
                conditions: { _id: entityId, business: businessId },
                expand: query?.expand,
                select: query?.select,
            });
        }

        return this.repo.findOneWithOptions({
            conditions: { reference: id, business: businessId },
            expand: query?.expand,
            select: query?.select,
        });
    }

    async safeGet(
        businessId: Types.ObjectId,
        id: Types.ObjectId,
        currency?: AccountCurrency,
    ): Promise<HydratedDocument<Account>> {
        const account = await this.repo.findOne({
            _id: id,
            business: businessId,
        });

        if (account.status !== AccountStatus.Active) {
            throw AccountException.NotActive;
        }

        if (currency && account.currency !== currency) {
            throw AccountException.InvalidCurrency;
        }

        return account;
    }

    async safeGetMainDefault(
        businessId: Types.ObjectId,
        currency: AccountCurrency,
    ): Promise<HydratedDocument<Account>> {
        const account = await this.repo.findOne({
            business: businessId,
            default: true,
            type: AccountType.Main,
            currency,
        });

        if (account.status !== AccountStatus.Active) {
            throw AccountException.NotActive;
        }

        return account;
    }

    public async addDepositChannels(
        businessId: Types.ObjectId,
        accountId: Types.ObjectId,
        dto: AddDepositChannelDto,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Account>> {
        const acc = await this.repo.findOne({ _id: accountId, business: businessId });

        if (!DepositaryCurrencies.includes(acc.currency)) {
            throw AccountException.DepositCurrencyNotSupported;
        }

        const existing = Array.isArray(acc.depositChannels) && acc.depositChannels.find((v) => v.type === dto.type);
        if (existing) {
            throw AccountException.DepositChannelAlreadyExists;
        }

        const depositChannel = await this._createAccountDepositChannel(businessId, acc, options);
        return this.repo.findOneAndUpdate({ _id: acc.id }, { $push: { depositChannels: depositChannel } }, options);
    }

    private async _createAccountDepositChannel(
        businessId: Types.ObjectId,
        account: HydratedDocument<Account>,
        options?: ExecutionOptions,
    ): Promise<DepositChannel> {
        if (account.type == AccountType.Main) {
            return this._createMainDedicatedDepositChannel(businessId, options);
        }

        const customer = await this.customerService.safeGetVerification(
            businessId,
            account.customer,
            CustomerVerificationMinimumTier1,
        );
        return this._createDedicatedDepositChannel(customer, options);
    }

    public async updateDepositChannelAccountName(
        businessId: Types.ObjectId,
        accountId: Types.ObjectId,
        dto: RefreshDepositChannelDto,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Account>> {
        let customer: HydratedDocument<Customer>;
        const acc = await this.repo.findOne({ _id: accountId, business: businessId });

        const depositChannels = Array.isArray(acc.depositChannels) ? acc.depositChannels : [];
        const depositChannel = depositChannels.find((v) => v.accountNumber === dto.accountNumber);
        if (!depositChannel) {
            throw AccountException.DepositChannelNotFound;
        }

        if (acc.type != AccountType.Main) {
            customer = await this.customerService.safeGetVerification(
                businessId,
                acc.customer,
                CustomerVerificationMinimumTier2,
            );
        } else {
            customer = await this.customerService.safeGet(businessId, acc.customer);
        }

        const accountName = await this._updateDedicatedDepositChannel(customer, depositChannel.accountNumber, options);

        return this.repo.findOneAndUpdate(
            { _id: acc.id },
            { $set: { 'depositChannels.$[x].accountName': accountName } },
            { arrayFilters: [{ 'x.accountNumber': dto.accountNumber }], ...options },
        );
    }

    async getBalanceHistory(businessId: Types.ObjectId, accountId: Types.ObjectId, query: APIPagingDto) {
        const account = await this.repo.findOne({ _id: accountId, business: businessId });

        return this.balanceService.getHistory(account.balance, query);
    }

    async getBalanceHistoryCSV(businessId: Types.ObjectId, accountId: Types.ObjectId, query: APIPagingDto) {
        const account = await this.repo.findOne({ _id: accountId, business: businessId });

        const entries = await this.balanceService.generateHistoryEntries(account.balance, query);

        const columns = [
            { key: 'source', header: 'Source' },
            { key: 'reference', header: 'Reference' },
            { key: 'mode', header: 'Mode' },
            { key: 'typeDescriptor', header: 'Type' },
            { key: 'currency', header: 'Currency' },
            { key: 'signedTotal', header: 'Change Amount' },
            { key: 'balanceBefore', header: 'Balance Before' },
            { key: 'balanceAfter', header: 'Balance After' },
            { key: 'description', header: 'Description' },
            { key: 'narration', header: 'Narration' },
            { key: 'txTimeUTC', header: 'Date' },
        ];

        const csv = stringify(entries, { header: true, columns });
        const fileName = `hyphen-account-balance-logs-generated-${format(new Date(), 'yyyy-MM-dd')}.csv`;

        return [csv, fileName];
    }

    async getStatementPDF(businessId: Types.ObjectId, accountId: Types.ObjectId, query: GenerateStatementDto) {
        const account = await this.repo.findOne({ _id: accountId, business: businessId });

        const timezone = query.timezone;
        const business = await this.businessService.findOneWithOptions({
            conditions: { _id: account.business },
            expand: 'kyc',
        });

        const entries = await this.balanceService.generateStatementEntries(account.balance, timezone, query);

        const totalDebit = entries.reduce((acc, curr) => acc + curr.amountOut, 0);
        const totalCredit = entries.reduce((acc, curr) => acc + curr.amountIn, 0);

        const openingBalance = entries[0]?.balanceBefore ?? 0;
        const closingBalance = entries[entries.length - 1]?.balanceAfter ?? 0;

        const businessAddress = business.kyc.businessAddress;
        const addressLine1 = businessAddress.addressLineOne;
        const addressLine2 = businessAddress.addressLineTwo
            ? `${businessAddress.addressLineTwo}  ${businessAddress.city}, ${businessAddress.state} ${businessAddress.countryCode}`
            : `${businessAddress.city}, ${businessAddress.state} ${businessAddress.countryCode}`;

        entries.unshift({
            amount: openingBalance,
            amountIn: openingBalance,
            amountOut: openingBalance,
            balanceBefore: openingBalance,
            balanceAfter: openingBalance,
            description: 'Opening Balance',
            narration: 'Opening Balance',
            timeStr: '00:00:01',
            date: query.startDate,
            type: 'balance',
            reference: 'OB-' + query.startDate,
        });

        entries.push({
            amount: closingBalance,
            amountIn: closingBalance,
            amountOut: closingBalance,
            balanceBefore: closingBalance,
            balanceAfter: closingBalance,
            description: 'Closing Balance',
            narration: 'Closing Balance',
            timeStr: '00:00:01',
            date: query.endDate,
            type: 'balance',
            reference: 'CB-' + query.endDate,
        });

        const content: BalanceStatementData = {
            statementPeriod: {
                from: query.startDate,
                to: query.endDate,
            },
            customerDetails: {
                customerName: business.name,
                addressLine1: addressLine1,
                addressLine2: addressLine2,
            },
            accountDetails: {
                accountName: account.name,
                accountNumber: account.depositChannels[0].accountNumber,
                accountType: 'Current Account',
                currency: account.currency,
            },
            accountSummary: {
                openingBalance: openingBalance,
                closingBalance: closingBalance,
                totalDeposits: totalDebit,
                totalWithdrawals: totalCredit,
            },
            transactions: entries,
        };

        const accountTagId = TagMongoId(ModelIdTag.Account, account.id);
        const fileName = `hyphen-account-statement-generated-${accountTagId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

        const response = await this._generateAccountStatementPDF(content);
        if (response && response.code === EnvoyResponseCode.Success) {
            const pdfBuffer = Buffer.from(response.data.bytes, 'base64');
            return [pdfBuffer, fileName];
        }

        throw AppException.ServiceUnavailable.setMessage('Unable to generate PDF');
    }

    async createDynamicDepositChannel(
        businessId: Types.ObjectId,
        type: DepositChannelType,
        name: string,
        options?: ExecutionOptions,
    ): Promise<DepositChannel> {
        const accountName = await this._buildDynamicAccountName(businessId, name);
        return this._createDepositChannel(accountName, type, true, options);
    }

    private async _createDedicatedDepositChannel(
        customer: HydratedDocument<Customer>,
        options?: ExecutionOptions,
    ): Promise<DepositChannel> {
        const accountName = await this._buildDedicatedAccountName(customer);
        return this._createDepositChannel(accountName, DepositChannelType.BankAccount, false, options);
    }

    private async _createMainDedicatedDepositChannel(
        businessId: Types.ObjectId,
        options?: ExecutionOptions,
    ): Promise<DepositChannel> {
        const kyc = await this.businessKYCService.safeGet(businessId, this.request);
        return this._createDepositChannel(
            kyc.businessInformation.businessName,
            DepositChannelType.BankAccount,
            false,
            options,
        );
    }

    private async _createDepositChannel(
        accountName: string,
        type: DepositChannelType,
        dynamic: boolean,
        options?: ExecutionOptions,
    ): Promise<DepositChannel> {
        if (options?.dryRun) {
            return Promise.resolve({
                accountName: accountName,
                accountNumber: Luhn.generateWithPrefix('00', 10),
                bankName: 'Allawee Sandbox Bank',
                bankCode: '000',
                type: type,
                partner: VirtualAccountPartner.AllaweeSandbox,
            });
        }

        const integration = getVACIntegration(this.config, this.http, this.reporter);
        const result = await integration.createDepositChannel(accountName, dynamic);
        if (!result) {
            throw AppException.ServiceUnavailable.setMessage('Deposit method is not available');
        }

        return {
            accountName: result.accountName,
            accountNumber: result.accountNumber,
            bankName: result.bankName,
            bankCode: result.bankCode,
            type: type,
            partner: result.partner,
        };
    }

    private async _updateDedicatedDepositChannel(
        customer: HydratedDocument<Customer>,
        accountNumber: string,
        options?: ExecutionOptions,
    ): Promise<string> {
        const accountName = await this._buildDedicatedAccountName(customer);
        if (options?.dryRun || GetTenantDataSource(this.request) == TenantDataSource.Sandbox) {
            return accountName;
        }

        const integration = getVACIntegration(this.config, this.http, this.reporter);
        const result = await integration.updateDepositChannel(accountNumber, accountName);
        if (!result) {
            throw AppException.ServiceUnavailable.setMessage('Deposit method is not available');
        }

        return result;
    }

    async getBalance(businessId: Types.ObjectId, accountId: Types.ObjectId) {
        const account = await this.repo.findOne({ _id: accountId, business: businessId });
        return this.balanceService.getOne(account.balance);
    }

    private _allowsDeposit(dto: CreateAccountDto): boolean {
        if (!DepositaryCurrencies.includes(dto.currency)) {
            throw AccountException.DepositCurrencyNotSupported;
        }

        return Array.isArray(dto.depositChannels) && dto.depositChannels.includes(DepositChannelType.BankAccount);
    }

    private async _buildDedicatedAccountName(customer: HydratedDocument<Customer>): Promise<string> {
        await this.customerService.ensureVerification(customer, CustomerVerificationMinimumTier1);
        const name = this.customerService.getOfficialName(customer);

        const kyc = await this.businessKYCService.safeGet(customer.business.toString(), this.request);

        if (kyc?.infraOwned) {
            return name;
        }

        return kyc ? `${name} - ${kyc.businessInformation.businessName}` : name;
    }

    private async _buildDynamicAccountName(businessId: Types.ObjectId, name: string): Promise<string> {
        const kyc = await this.businessKYCService.safeGet(businessId, this.request);

        if (kyc?.infraOwned) {
            return name;
        }

        return kyc ? `${name} - ${kyc.businessInformation.businessName}` : name;
    }

    private async _generateAccountStatementPDF(
        content: Record<string, any>,
        options?: ExecutionOptions,
    ): Promise<StaticEnvoyResponse> {
        if (options?.dryRun) {
            return;
        }
        const payload = {
            action: 'pdf.generate-account-statement',
            content: content,
        };

        const res = await this.envoy.dispatchSync<StaticEnvoyResponse>(EnvoyEvent.newStatic(payload), 10000);
        return res?.payload;
    }
}
