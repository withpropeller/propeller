import { Business } from '@api/business/business.schema';
import { Repository, RepositoryFactory } from '@core/abstracts/repository';
import { AppException } from '@core/exceptions';
import {
    AppStatus,
    GetTenantDataSource,
    ModelIdTag,
    TenantDataSource,
    TenantRequestPayload,
    Utils,
} from '@core/helpers';
import { ReporterService } from '@common/services/reporter.service';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { AccountCurrency, AccountType, DepositChannelType, VirtualAccountPartner } from './account.enums';
import { AccountException } from './account.exception';
import { Account, DepositChannel } from './accounts.schema';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { ShortTransactionMode, TransactionMode } from '@api/transactions/transactions.enums';
import { plainToInstance } from 'class-transformer';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';
import { AccountLog } from './account-logs.schema';
import { ExecutionOptions } from '@common/interfaces';
import { CardAuthorization } from '@api/card-authorizations/card-authorization.schema';
import { PaymentType } from '@api/payments/payment.enums';
import { Payment } from '@api/payments/payment.schema';
import {
    AddDepositChannelDto,
    RefreshDepositChannelDto,
    SetDepositChannelDto,
    UpdateOverdraftDto,
} from './account.dto';
import { MetricsQueryDto } from '@common/dtos';
import { CustomerService } from '@api/customer/customer.service';
import {
    Customer,
    CustomerVerificationMinimumTier1,
    CustomerVerificationMinimumTier2,
} from '@api/customer/customer.schema';
import { TransferService } from '@api/tools/banks/banks.service';
import { BusinessException } from '@api/business/business.exception';
import { BusinessKYC } from '@api/business/business-kyc.schema';
import { BalanceService } from '@api/balance/balance.service';
import { CreateAccountBalanceDto } from '@api/balance/balance.interface';
import { Luhn } from '@common/helpers';
import { getVACIntegration } from './account.utils';
import { ConfigService } from '@config/config.service';
import { HttpService } from '@nestjs/axios';
import { Balance } from '@api/balance/balance.schema';
import { ModelObjectPartial, ObjectType, SchemaTransform } from '@core/mongo';
import { getTotalBalancePipeline } from '@api/balance/balance.utils';
import { Approval } from '@api/approvals/approvals.schema';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class AccountService {
    public repo: Repository<Account>;
    public logRepo: Repository<AccountLog>;
    private businessKYCRepo: Repository<BusinessKYC>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private reporter: ReporterService,
        @InjectModel(Business.name, TenantDataSource.Core) private businessModel: Model<HydratedDocument<Business>>,
        @InjectModel(BusinessKYC.name, TenantDataSource.Core) businessKYCModel: Model<HydratedDocument<BusinessKYC>>,
        private customerService: CustomerService,
        private balanceService: BalanceService,
        private transferService: TransferService,
        private config: ConfigService,
        private http: HttpService,
    ) {
        const model = this.moduleRef.get(getModelToken(Account.name, GetTenantDataSource(request)), { strict: false });
        const logModel = this.moduleRef.get(getModelToken(AccountLog.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Account>(model);
        this.logRepo = RepositoryFactory<AccountLog>(logModel);
        this.businessKYCRepo = RepositoryFactory<BusinessKYC>(businessKYCModel);
    }

    getAll(query: APIPagingDto) {
        return this.repo.findByQuery(query, {}, [], [{ path: 'business', model: this.businessModel }]);
    }

    getOne(id: Types.ObjectId, query: APIPagingDto) {
        return this.repo.findOneWithOptions({
            conditions: { _id: id },
            select: query.select,
            expand: query.expand,
            populate: [{ path: 'business', model: this.businessModel }],
        });
    }

    async getMetrics(query: MetricsQueryDto) {
        const matchStage: Record<string, any> = {};
        if (query.from || query.to) {
            matchStage.createdAt = {};
            if (query.from) matchStage.createdAt.$gte = new Date(query.from);
            if (query.to) matchStage.createdAt.$lte = new Date(query.to);
        }

        const [result] = await this.repo.aggregate([
            ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    byType: [
                        { $group: { _id: '$type', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
            {
                $project: {
                    byStatus: {
                        $arrayToObject: {
                            $map: { input: '$byStatus', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    byType: {
                        $arrayToObject: {
                            $map: { input: '$byType', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byStatus: {}, byType: {}, total: 0 };
    }

    async approveOverdraft(approval: HydratedDocument<Approval>, body: UpdateOverdraftDto, options?: ExecutionOptions) {
        const account = await this.repo.findOne({ _id: approval.data.account });

        return this.balanceService.updateOverdraft(account.balance, body.overdraftLimit, approval.id, options);
    }

    async getBalanceHistory(accountId: Types.ObjectId, query: APIPagingDto) {
        const account = await this.repo.findOne({ _id: accountId });

        return this.balanceService.getHistory(account.balance, query);
    }

    async getBalanceHistoryCSV(accountId: Types.ObjectId, query: APIPagingDto) {
        const account = await this.repo.findOne({ _id: accountId });

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
            { key: 'txTimeUTC', header: 'Date' },
        ];

        const csv = stringify(entries, { header: true, columns });
        const fileName = `hyphen-account-balance-logs-generated-${format(new Date(), 'yyyy-MM-dd')}.csv`;

        return [csv, fileName];
    }

    async getLogsCSV(accountId: Types.ObjectId, query: APIPagingDto): Promise<any> {
        const account = await this.repo.findById(accountId);

        const defaultQuery = {
            select: [
                'reference',
                'mode',
                'currency',
                'source',
                'availableBalance',
                'lockedBalance',
                'changeAmount',
                'changeLockAmount',
                'createdAt',
            ],
            expand: 'source',
        };

        const { select, conditions, sort, populate } = MongoAPIPaging.getPagingConstraints(
            { ...query, ...defaultQuery },
            {
                account: account.id,
                mode: {
                    $nin: [TransactionMode.PlaceLien, TransactionMode.ReverseLien],
                },
            },
        );

        const results = await this.logRepo.find(conditions, select, sort, populate);

        const data = results.map((v) => {
            const log = plainToInstance(AccountLog, v.toJSON()) as any;
            const changeAmount = log.changeAmount + log.changeLockAmount;
            const balanceBefore = log.availableBalance - changeAmount;
            const { narration, type, description } = this.getAccountLogNarrationType(log);

            return {
                reference: log.reference ? log.reference : '',
                mode: ShortTransactionMode(log.mode),
                type: type,
                currency: log.currency,
                description: description,
                narration: narration,
                balanceBefore: balanceBefore / 100,
                balanceAfter: log.availableBalance / 100,
                changeAmount: changeAmount / 100,
                lockedBalance: log.lockedBalance / 100,
                createdAt: log.createdAt.toISOString(),
            };
        });

        const columns = [
            { key: 'reference', header: 'Reference' },
            { key: 'mode', header: 'Mode' },
            { key: 'type', header: 'Transaction Type' },
            { key: 'currency', header: 'Currency' },
            { key: 'description', header: 'Description' },
            { key: 'narration', header: 'Narration' },
            { key: 'changeAmount', header: 'Change Amount' },
            { key: 'balanceBefore', header: 'Balance Before' },
            { key: 'balanceAfter', header: 'Balance After' },
            { key: 'lockedBalance', header: 'Locked Balance' },
            { key: 'createdAt', header: 'Date' },
        ];

        const csv = stringify(data, { header: true, columns });

        const fileName = `hyphen-account-logs-generated-${format(new Date(), 'yyyy-MM-dd')}.csv`;

        return [csv, fileName];
    }

    getAccountLogNarrationType(log: AccountLog): { description: string; narration?: string; type: string } {
        if (log.source && log.source.object == ObjectType.CardAuthorization) {
            const source = log.source as CardAuthorization;
            const mode = log.mode === TransactionMode.Credit ? 'Reversal' : 'Charge';
            return { type: `Card ${mode}`, description: source.networkData.cardAcceptorNameLocation };
        }

        if (log.source && log.source.object == ObjectType.Payment) {
            const source = log.source as Payment;
            if (source.type == PaymentType.PayOut && source.methodData?.bankTransfer) {
                return {
                    type: 'Bank Transfer',
                    description: `To: ${source.methodData.bankTransfer.accountName} (${source.methodData.bankTransfer.bankName} - ${source.methodData.bankTransfer.accountNumber})`,
                    narration: source.methodData.bankTransfer.narration,
                };
            }
            if (source.type == PaymentType.PayIn && source.methodData?.bankTransfer) {
                return {
                    type: 'Bank Transfer',
                    description: `From: ${source.methodData.bankTransfer.accountName} (${source.methodData.bankTransfer.bankName} - ${source.methodData.bankTransfer.accountNumber})`,
                    narration:
                        source.methodData.bankTransfer.narration == 'null'
                            ? ''
                            : source.methodData.bankTransfer.narration,
                };
            }

            if (source.methodData?.fxCharge) {
                const currencyAmount = Utils.parseInt64ToCurrency(
                    source.methodData?.fxCharge?.amount,
                    source.methodData?.fxCharge?.currency,
                );
                return {
                    type: 'FX Charge',
                    description: `${Utils.fromSlug(source.methodData.fxCharge.type)} of ${currencyAmount}`,
                };
            }
        }

        return { type: '', description: '' };
    }

    // TODO: should remove account from response, as it is not a balance property
    async getBalance(id: Types.ObjectId, query?: APIPagingDto) {
        const account = await this.repo.findById(id);
        const data = await this.balanceService.findAndVerify(account.balance.toString());

        const balance = SchemaTransform(data, {
            objectIds: ['balance:bal', 'source#sourceRef'],
            tag: ModelIdTag.Balance,
            pick: '-_meta',
        });
        const select = MongoAPIPaging.parseSpaceSeparated(query?.select);
        if (select.length > 0) {
            return Utils.pickKeys(balance, select.join(' '));
        }

        return balance;
    }

    async getTotalBalance(): Promise<ModelObjectPartial<Balance>> {
        const pipeline = getTotalBalancePipeline();
        const result = await this.balanceService.repo.aggregate(pipeline);

        return {
            available: result[0].totalBalance,
            object: ObjectType.Balance,
        };
    }

    public async refreshDepositChannelAccountName(
        accountId: Types.ObjectId,
        dto: RefreshDepositChannelDto,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Account>> {
        let customer: HydratedDocument<Customer>;
        const acc = await this.repo.findOne({ _id: accountId });

        const depositChannels = Array.isArray(acc.depositChannels) ? acc.depositChannels : [];
        const depositChannel = depositChannels.find((v) => v.accountNumber === dto.accountNumber);
        if (!depositChannel) {
            throw AccountException.DepositChannelNotFound;
        }

        if (acc.type != AccountType.Main) {
            customer = await this.customerService.safeGetVerification(
                acc.business,
                acc.customer,
                CustomerVerificationMinimumTier2,
            );
        }

        const accountName = await this.updateDedicatedDepositChannel(customer, depositChannel.accountNumber, options);

        return this.repo.findOneAndUpdate(
            { _id: acc._id },
            { $set: { 'depositChannels.$[x].accountName': accountName } },
            { arrayFilters: [{ 'x.accountNumber': dto.accountNumber }], ...options },
        );
    }

    async addDepositChannel(
        accountId: Types.ObjectId,
        body: AddDepositChannelDto,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Account>> {
        // Create account
        const account = await this.repo.findById(accountId);

        // Create Deposit Channel
        const depositChannel = await this.createDepositChannel(
            body.accountName,
            DepositChannelType.BankAccount,
            false,
            options,
        );

        return this.repo.findOneAndUpdate(
            { _id: account._id },
            { $push: { depositChannels: depositChannel } },
            options,
        );
    }

    public async setDepositChannelAccountName(
        accountId: Types.ObjectId,
        dto: SetDepositChannelDto,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Account>> {
        const acc = await this.repo.findOne({ _id: accountId });

        const depositChannels = Array.isArray(acc.depositChannels) ? acc.depositChannels : [];
        const depositChannel = depositChannels.find((v) => v.accountNumber === dto.accountNumber);
        if (!depositChannel) {
            throw AccountException.DepositChannelNotFound;
        }

        const integration = this.transferService.getSettlementIntegration();
        const result = await integration.updateDepositChannel(depositChannel.accountNumber, dto.accountName);
        if (!result) {
            throw AppException.ServiceUnavailable.setMessage('Deposit method is not available');
        }

        return this.repo.findOneAndUpdate(
            { _id: acc._id },
            { $set: { 'depositChannels.$[x].accountName': result } },
            { arrayFilters: [{ 'x.accountNumber': dto.accountNumber }], ...options },
        );
    }

    public async updateDedicatedDepositChannel(
        customer: HydratedDocument<Customer>,
        accountNumber: string,
        options?: ExecutionOptions,
    ): Promise<string> {
        const accountName = await this.buildDedicatedAccountName(customer);
        if (options?.dryRun || GetTenantDataSource(this.request) == TenantDataSource.Sandbox) {
            return accountName;
        }

        const integration = this.transferService.getSettlementIntegration();
        const result = await integration.updateDepositChannel(accountNumber, accountName);
        if (!result) {
            throw AppException.ServiceUnavailable.setMessage('Deposit method is not available');
        }

        return result;
    }

    private async buildDedicatedAccountName(customer: HydratedDocument<Customer>): Promise<string> {
        await this.customerService.ensureVerification(customer, CustomerVerificationMinimumTier1);
        const name = this.customerService.getOfficialName(customer);

        const kyc = await this.businessKYCRepo.findOne({ business: customer.business });

        if (!kyc && GetTenantDataSource(this.request) === TenantDataSource.Live) {
            throw BusinessException.KycNotCompleted;
        }

        if (kyc?.infraOwned) {
            return name;
        }

        return kyc ? `${name} - ${kyc.businessInformation.businessName}` : name;
    }

    async createDefaultMainAccount(
        business: HydratedDocument<Business>,
        accountName: string,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Account>> {
        const count = await this.repo.count({ business: business.id });

        if (count > 0) {
            return this.repo.findOne({ business: business.id, type: AccountType.Main });
        }

        // Create account
        const account = await this.createDefaultMainAccountEntity(business, accountName, options);

        // Create balance
        const balanceData: CreateAccountBalanceDto = {
            currency: account.currency,
            account: account._id,
            business: business._id,
        };
        const balanceId = await this.balanceService.createAccountBalance(balanceData, options);
        await this.repo.updateById(account._id, { $set: { balance: balanceId } }, options);

        // Create Deposit Channel
        const depositChannel = await this.createDepositChannel(
            accountName,
            DepositChannelType.BankAccount,
            false,
            options,
        );

        return this.repo.findOneAndUpdate(
            { _id: account._id },
            { $push: { depositChannels: depositChannel } },
            options,
        );
    }

    private async createDefaultMainAccountEntity(
        business: HydratedDocument<Business>,
        accountName: string,
        options?: ExecutionOptions,
    ) {
        const entity: Partial<Account> = Utils.removeNilValues({
            name: accountName,
            type: AccountType.Main,
            business: business.id,
            currency: AccountCurrency.NGN,
            default: true,
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

    private async createDepositChannel(
        accountName: string,
        type: DepositChannelType,
        dynamic: boolean,
        options?: ExecutionOptions,
    ): Promise<DepositChannel> {
        if (options?.dryRun || GetTenantDataSource(this.request) == TenantDataSource.Sandbox) {
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
}
