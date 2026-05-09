import { ModelIdTag, Repository, RepositoryFactory, SchemaTransform } from '@core/mongo';
import { GetTenantDataSource, TenantRequestPayload, Utils } from '@core/helpers';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BalanceService } from '@api/balance/balance.service';
import { AddDepositChannelDto, CreateReserveAccountDto, DebitReserveAccountDto } from './reserve-account.dto';
import { ReserveAccountException } from './reserve-account.exception';
import { ExecutionOptions } from '@common/interfaces';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { ReserveAccount } from './reserve-accounts.schema';
import { AdminService } from '@api/admins/admin.service';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { Request } from 'express';
import {
    AccountStatus,
    DepositaryCurrencies,
    DepositChannelType,
    VirtualAccountPartner,
} from '@api/account/account.enums';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { getVACIntegration } from '@api/account/account.utils';
import { AppException } from '@core/exceptions';
import { DepositChannel } from '@api/account/accounts.schema';
import { ConfigService } from '@config/config.service';
import { Luhn } from '@common/helpers';
import { ReporterService } from '@common/services/reporter.service';
import { HttpService } from '@nestjs/axios';
import { TransferSettlementAccountDto } from '@api/settlement-accounts/settlement-account.dto';
import { SettlementAccountService } from '@api/settlement-accounts/settlement-account.service';
import { ReservePaymentService } from '@api/reserve-payments/reserve-payment.service';
import { GetBalanceResponse } from '@common/grpc';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ReserveAccountService {
    public repo: Repository<ReserveAccount>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private envoy: EnvoyService,
        private balanceService: BalanceService,
        private adminService: AdminService,
        private auditService: AdminAuditService,
        private settlementAccountService: SettlementAccountService,
        private reservePaymentService: ReservePaymentService,
        private config: ConfigService,
        private http: HttpService,
        private reporter: ReporterService,
    ) {
        const model = this.moduleRef.get(getModelToken(ReserveAccount.name, GetTenantDataSource(request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<ReserveAccount>(model);
    }

    async create(adminId: Types.ObjectId, body: CreateReserveAccountDto, req: Request, options?: ExecutionOptions) {
        const existingReserveAccount = await this.repo.findOne({ slug: body.slug }, { failSilently: true });
        if (existingReserveAccount) {
            throw ReserveAccountException.SlugAlreadyExists;
        }

        // create reserve account
        const data = {
            name: body.name,
            slug: body.slug,
            status: AccountStatus.Active,
            currency: body.currency,
        };

        const reserveAccount = await this.repo.createAndSave(data, options);

        // get admin
        const admin = await this.adminService.findById(adminId);

        // create balance
        const dto = { currency: body.currency, reserveAccount: reserveAccount._id };
        const resBalanceId = await this.balanceService.createReserveAccountBalance(dto, options);

        // update reserve account with balance
        const updated = await this.repo.findByIdAndUpdate(reserveAccount.id, { balance: resBalanceId }, options);

        if (!options?.dryRun) {
            const reportMessage = `${admin.firstName} ${admin.lastName}(${admin.email}) created reserve account: ${body.name}`;
            await this.auditService.registerReserveAccountCreate(reserveAccount.id, admin, req, data, reportMessage);
        }

        return updated;
    }

    getBalance(reserveAccountBalance: Types.ObjectId): Promise<GetBalanceResponse> {
        return this.balanceService.findAndVerify(reserveAccountBalance);
    }

    async fetchBySlug(slug: string): Promise<HydratedDocument<ReserveAccount>> {
        return this.repo.findOne({ slug });
    }

    async fetchBalance(id: Types.ObjectId, query?: APIPagingDto) {
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

    async debitBalance(
        adminId: Types.ObjectId,
        id: Types.ObjectId,
        body: DebitReserveAccountDto,
        req: Request,
        options?: ExecutionOptions,
    ) {
        const account = await this.repo.findById(id);

        // get admin
        const admin = await this.adminService.findById(adminId);

        const payload = {
            action: 'increment-reserve',
            slug: account.slug,
            amount: body.amount * -1,
        };

        if (!options?.dryRun) {
            await this.envoy.dispatch(EnvoyEvent.newISV(GetTenantDataSource(this.request), payload));
            const reportMessage = `${admin.firstName} ${admin.lastName}(${admin.email}) credited reserve account: ${account.name} by ${body.amount}`;
            await this.auditService.registerReserveAccountDebit(account.id, admin, req, body, reportMessage);
        }
    }

    async creditBalance(
        adminId: Types.ObjectId,
        id: Types.ObjectId,
        body: DebitReserveAccountDto,
        req: Request,
        options?: ExecutionOptions,
    ) {
        const account = await this.repo.findById(id);

        // get admin
        const admin = await this.adminService.findById(adminId);

        const payload = {
            action: 'increment-reserve',
            slug: account.slug,
            amount: body.amount,
        };

        if (!options?.dryRun) {
            await this.envoy.dispatch(EnvoyEvent.newISV(GetTenantDataSource(this.request), payload));
            const reportMessage = `${admin.firstName} ${admin.lastName}(${admin.email}) credited reserve account: ${account.name} by ${body.amount}`;
            await this.auditService.registerReserveAccountCredit(account.id, admin, req, body, reportMessage);
        }
    }

    public async addDepositChannels(
        adminId: Types.ObjectId,
        accountId: Types.ObjectId,
        dto: AddDepositChannelDto,
        req: Request,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<ReserveAccount>> {
        const acc = await this.repo.findOne({ _id: accountId });

        // get admin
        const admin = await this.adminService.findById(adminId);

        if (!DepositaryCurrencies.includes(acc.currency)) {
            throw ReserveAccountException.DepositCurrencyNotSupported;
        }

        const existing = Array.isArray(acc.depositChannels) && acc.depositChannels.find((v) => v.type === dto.type);
        if (existing) {
            throw ReserveAccountException.DepositChannelAlreadyExists;
        }

        const depositChannel = await this._createDepositChannel(dto.type, options);
        const reserveAccount = await this.repo.findOneAndUpdate(
            { _id: acc.id },
            { $push: { depositChannels: depositChannel } },
            options,
        );

        await this.auditService.registerReserveAccountAddDepositChannel(acc, admin, req, dto, options);
        return reserveAccount;
    }

    private async _createDepositChannel(type: DepositChannelType, options?: ExecutionOptions): Promise<DepositChannel> {
        const accountName = 'Allawee Technologies Ltd';
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
        const result = await integration.createDepositChannel(accountName, false);
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

    async transferToSettlementAccount(
        adminId: Types.ObjectId,
        id: Types.ObjectId,
        body: TransferSettlementAccountDto,
        req: Request,
        options: ExecutionOptions,
    ) {
        const fromReserveAccount = await this.repo.findById(id);
        const admin = await this.adminService.findById(adminId);
        const toSettlementAccount = await this.settlementAccountService.repo.findById(body.settlementAccount);

        return this.reservePaymentService.createSettlementTransfer(
            admin,
            fromReserveAccount,
            toSettlementAccount,
            body.amount,
            options,
            req,
        );
    }
}
