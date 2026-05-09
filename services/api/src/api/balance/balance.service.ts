import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { GetTenantDataSource, TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { HydratedDocument, Types } from 'mongoose';
import { BalanceException } from './balance.exception';
import { Account } from '@api/account/accounts.schema';
import { Repository, RepositoryFactory } from '@core/mongo';
import { getModelToken } from '@nestjs/mongoose';
import { ExecutionOptions } from '@common/interfaces';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { AppStatus, Utils } from '@core/helpers';
import { Balance, BalanceHistory } from './balance.schema';
import { buildBalanceStatementTxnData, getBalanceStatementPipeline } from './balance.utils';
import { BalanceHistoryEntry, BalanceStatementTransaction, CreateAccountBalanceDto } from './balance.interface';
import { getBalanceHistoryPipeline } from './balance.utils';
import { buildBalanceHistoryData } from './balance.utils';
import { GenerateStatementDto } from '@api/account/account.dto';

export interface IFundingSource {
    id: Types.ObjectId;
    ref: string;
    account?: HydratedDocument<Account>;
}

@Injectable({ scope: Scope.REQUEST, durable: true })
export class BalanceService {
    public repo: Repository<Balance>;
    public accountRepo: Repository<Account>;
    public historyRepo: Repository<BalanceHistory>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        moduleRef: ModuleRef,
    ) {
        const accountModel = moduleRef.get(getModelToken(Account.name, GetTenantDataSource(request)), {
            strict: false,
        });
        const historyModel = moduleRef.get(getModelToken(BalanceHistory.name, GetTenantDataSource(request)), {
            strict: false,
        });
        const balanceModel = moduleRef.get(getModelToken(Balance.name, GetTenantDataSource(request)), {
            strict: false,
        });
        this.accountRepo = RepositoryFactory<Account>(accountModel);
        this.historyRepo = RepositoryFactory<BalanceHistory>(historyModel, {
            defaultSort: { '_meta.txTime': -1 },
        });
        this.repo = RepositoryFactory<Balance>(balanceModel);
    }

    async getOne(balanceId: Types.ObjectId) {
        return this.repo.findOneById(balanceId);
    }

    async createAccountBalance(dto: CreateAccountBalanceDto, options?: ExecutionOptions): Promise<Types.ObjectId> {
        // gRPC balance service removed — in MOR, balances come from TigerBeetle via Flo projections.
        // Stub: return a dummy balanceId for now; real implementation will use Flo KV projections.
        if (options?.dryRun) {
            return new Types.ObjectId();
        }
        // TODO: Wire to TigerBeetle balance projection in Wave 3
        return new Types.ObjectId();
    }

    async findAndVerify(entityId: string | Types.ObjectId): Promise<any> {
        // gRPC balance service removed — in MOR, balances come from TigerBeetle via Flo projections.
        // Stub: return a dummy balance; real implementation will use Flo KV projections.
        return { available: 0, ledger: 0, overdraftLimit: 0 };
    }

    async ensureSufficientFunds(balanceId: Types.ObjectId, amount: number) {
        const balance = await this.findAndVerify(balanceId);
        if (balance.overdraftLimit && balance.available + balance.overdraftLimit < amount) {
            throw BalanceException.InsufficientFunds;
        }

        if (balance.available < amount) {
            throw BalanceException.InsufficientFunds;
        }
    }

    async isSufficientFunds(balanceId: Types.ObjectId, amount: number) {
        const balance = await this.findAndVerify(balanceId);
        if (balance.overdraftLimit && balance.available + balance.overdraftLimit < amount) {
            return false;
        }

        if (balance.available < amount) {
            return false;
        }

        return true;
    }

    async getHistory(balanceId: Types.ObjectId, query: APIPagingDto) {
        let { conditions } = MongoAPIPaging.getPagingConstraints(query, { '_meta.origId': balanceId });
        conditions = Utils.renameKey(conditions, 'createdAt', '_meta.txTime');
        conditions = Utils.renameKey(conditions, 'txTime', '_meta.txTime');
        delete query.filter;

        return this.historyRepo.findByQuery(query, conditions);
    }

    async generateHistoryEntries(balanceId: Types.ObjectId, query: APIPagingDto): Promise<BalanceHistoryEntry[]> {
        const defaultConditions = { '_meta.origId': balanceId };
        let { conditions } = MongoAPIPaging.getPagingConstraints(query, defaultConditions);

        conditions = Utils.renameKey(conditions, 'createdAt', '_meta.txTime');

        const pipeline = getBalanceHistoryPipeline(conditions);
        const res = await this.historyRepo.aggregate(pipeline);

        return res.map((doc) => buildBalanceHistoryData(doc));
    }

    async generateStatementEntries(
        balanceId: Types.ObjectId,
        timezone: string,
        query: GenerateStatementDto,
    ): Promise<BalanceStatementTransaction[]> {
        const pipeline = getBalanceStatementPipeline(balanceId, query);
        const res = await this.historyRepo.aggregate(pipeline);

        return res.map((doc) => buildBalanceStatementTxnData(doc, timezone));
    }
}
