import { Repository, RepositoryFactory } from '@core/abstracts/repository';
import { ModelIdTag, ObjectType, TagMongoId, TenantDataSource } from '@core/helpers';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { plainToInstance } from 'class-transformer';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';
import { SettlementAccount, SettlementAccountLog } from './settlement-account.schema';
import { getSettlementAccountIntegration } from './settlement-account.utils';
import { ReporterService } from '@common/services/reporter.service';
import { ConfigService } from '@config/config.service';
import { HttpService } from '@nestjs/axios';
import { TransferSettlementAccountDto } from './settlement-account.dto';
import { AdminService } from '@api/admins/admin.service';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { ExecutionOptions } from '@common/interfaces';
import { Request } from 'express';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { AppException } from '@core/exceptions';
import { MetricsQueryDto } from '@common/dtos';

@Injectable()
export class SettlementAccountService {
    public logRepo: Repository<SettlementAccountLog>;
    public repo: Repository<SettlementAccount>;
    constructor(
        @InjectModel(SettlementAccountLog.name, TenantDataSource.Office)
        logModel: Model<HydratedDocument<SettlementAccountLog>>,
        @InjectModel(SettlementAccount.name, TenantDataSource.Office)
        repoModel: Model<HydratedDocument<SettlementAccount>>,
        private adminService: AdminService,
        private auditService: AdminAuditService,
        private config: ConfigService,
        private http: HttpService,
        private reporter: ReporterService,
        private envoy: EnvoyService,
    ) {
        this.repo = RepositoryFactory<SettlementAccount>(repoModel);
        this.logRepo = RepositoryFactory<SettlementAccountLog>(logModel, {
            searchFields: ['source'],
            refs: ['source'],
        });
    }

    async getLogsMetrics(query: MetricsQueryDto) {
        const matchStage: Record<string, any> = {};
        if (query.from || query.to) {
            matchStage.createdAt = {};
            if (query.from) matchStage.createdAt.$gte = new Date(query.from);
            if (query.to) matchStage.createdAt.$lte = new Date(query.to);
        }

        const [result] = await this.logRepo.aggregate([
            ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
            {
                $facet: {
                    byMode: [{ $group: { _id: '$mode', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
                    byCurrency: [
                        {
                            $group: {
                                _id: '$currency',
                                totalCredit: {
                                    $sum: { $cond: [{ $eq: ['$mode', 'credit'] }, '$amount', 0] },
                                },
                                totalDebit: {
                                    $sum: { $cond: [{ $eq: ['$mode', 'debit'] }, '$amount', 0] },
                                },
                                netChange: { $sum: '$changeAmount' },
                                creditCount: {
                                    $sum: { $cond: [{ $eq: ['$mode', 'credit'] }, 1, 0] },
                                },
                                debitCount: {
                                    $sum: { $cond: [{ $eq: ['$mode', 'debit'] }, 1, 0] },
                                },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
            {
                $project: {
                    byMode: {
                        $arrayToObject: {
                            $map: { input: '$byMode', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    byCurrency: '$byCurrency',
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byMode: {}, byCurrency: [], total: 0 };
    }

    async getLogsCSV(query: APIPagingDto, defaultConditions = {}): Promise<any> {
        const { conditions, sort, populate } = MongoAPIPaging.getPagingConstraints(query, {
            ...defaultConditions,
        });
        const select = ['reference', 'currency', 'mode', 'changeAmount', 'availableBalance', 'createdAt'];

        const results = await this.logRepo.find(conditions, select, sort, populate);

        const data = results.map((v) => {
            const log = plainToInstance(SettlementAccountLog, v.toJSON()) as any;
            const balanceBefore = log.availableBalance - log.changeAmount;

            return {
                reference: log.reference ? log.reference : '',
                currency: log.currency,
                mode: log.mode,
                balanceBefore: balanceBefore / 100,
                balanceAfter: log.availableBalance / 100,
                changeAmount: log.changeAmount / 100,
                createdAt: log.createdAt.toISOString(),
            };
        });

        const columns = [
            { key: 'reference', header: 'Reference' },
            { key: 'currency', header: 'Currency' },
            { key: 'changeAmount', header: 'Change Amount' },
            { key: 'balanceBefore', header: 'Balance Before' },
            { key: 'balanceAfter', header: 'Balance After' },
            { key: 'createdAt', header: 'Date' },
        ];

        const csv = stringify(data, { header: true, columns });

        const fileName = `hyphen-providus-settlement-account-logs-generated-${format(new Date(), 'yyyy-MM-dd')}.csv`;

        return [csv, fileName];
    }

    async getOneBalance() {
        const account = await this.repo.findOneWithOptions({
            conditions: { partner: 'providus' },
            expand: 'balance',
        });
        const data = await this.getSettlementBalance(account);

        return {
            id: TagMongoId(ModelIdTag.SettlementAccount, account._id),
            name: account.name,
            available: data.availableBalance,
            vostro: account.balance,
            object: ObjectType.SettlementAccountBalance,
        };
    }

    async getBalance(id: Types.ObjectId) {
        const account = await this.repo.findOneWithOptions({
            conditions: {
                _id: id,
            },
            expand: 'balance',
        });
        const data = await this.getSettlementBalance(account);

        return {
            id: TagMongoId(ModelIdTag.SettlementAccount, account._id),
            name: account.name,
            available: data.availableBalance,
            vostro: account.balance,
            object: ObjectType.SettlementAccountBalance,
        };
    }

    async getAllBalances() {
        const accounts = await this.repo.find();
        const data = await Promise.all(
            accounts.map(async (account) => {
                return this.getBalance(account._id);
            }),
        );
        return data;
    }

    async getSettlementBalance(account: HydratedDocument<SettlementAccount>) {
        const integration = getSettlementAccountIntegration(account.partner, this.config, this.http, this.reporter);
        const balance = await integration.getSettlementAccountBalance(account.identifier);

        return {
            availableBalance: balance,
            object: ObjectType.SettlementAccountBalance,
        };
    }

    async transfer(
        adminId: Types.ObjectId,
        id: Types.ObjectId,
        body: TransferSettlementAccountDto,
        req: Request,
        options: ExecutionOptions,
    ) {
        const fromAccount = await this.repo.findById(id);
        const admin = await this.adminService.findById(adminId);
        const toAccount = await this.repo.findById(body.settlementAccount);

        if (fromAccount._id.equals(toAccount._id)) {
            throw AppException.BadRequest.setMessage('Settlement account cannot be transferred to itself');
        }

        // create and send the envoy event
        if (!options?.dryRun) {
            await this.sendSettlementTransferEvent(fromAccount, body);
            const message = `Settlement account ${fromAccount.name} transferred ${body.amount} to ${toAccount.name}`;
            await this.auditService.registerSettlementAccountTransfer(fromAccount._id, admin, req, body, message);
        }
    }

    async sendSettlementTransferEvent(
        account: HydratedDocument<SettlementAccount>,
        body: TransferSettlementAccountDto,
    ) {
        const payload = {
            action: 'process-settlement-transfer',
            fromSettlementAccount: TagMongoId(ModelIdTag.SettlementAccount, account.id),
            toSettlementAccount: TagMongoId(ModelIdTag.SettlementAccount, body.settlementAccount),
            amount: body.amount,
        };

        return this.envoy.dispatch(EnvoyEvent.newPayment(TenantDataSource.Core, payload));
    }
}
