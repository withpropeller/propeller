import { Inject, Injectable, Scope } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Balance, BalanceHistory } from './balance.schema';
import { firstValueFrom } from 'rxjs';
import { AppStatus, GetTenantDataSource, TenantRequestPayload, Utils } from '@core/helpers';
import { BalanceException } from './balance.exception';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { LedgerRepository, LedgerRepositoryFactory, Repository, RepositoryFactory } from '@core/mongo';
import {
    CreateBalanceRequestDto,
    GetBalanceResponse,
    GRPCService,
    UpdateOverdraftRequestDto,
} from '@common/grpc/grpc.service';
import { ExecutionOptions } from '@common/interfaces';
import { BalanceHistoryEntry, CreateAccountBalanceDto, CreateReserveAccountBalanceDto } from './balance.interface';
import { buildBalanceHistoryData, getBalanceHistoryPipeline, toISVServerTenant } from './balance.utils';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class BalanceService {
    public repo: Repository<Balance>;
    public historyRepo: LedgerRepository<BalanceHistory>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private readonly grpcService: GRPCService,
    ) {
        const model = this.moduleRef.get(getModelToken(Balance.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Balance>(model);

        const historyModel = this.moduleRef.get(getModelToken(BalanceHistory.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.historyRepo = LedgerRepositoryFactory<BalanceHistory>(historyModel);
    }

    private async createBalance(dto: CreateBalanceRequestDto, options?: ExecutionOptions): Promise<Types.ObjectId> {
        if (options?.dryRun) {
            return new Types.ObjectId();
        }
        const res = await firstValueFrom(this.grpcService.createBalance(dto));

        if (res.code === AppStatus.Success) {
            return new Types.ObjectId(res.data.balanceId);
        }

        throw BalanceException.ISV_SERVICE_ERROR(res);
    }

    async createAccountBalance(dto: CreateAccountBalanceDto, options?: ExecutionOptions): Promise<Types.ObjectId> {
        return this.createBalance(
            {
                tenant: toISVServerTenant(this.request),
                pi: dto.account.toHexString(),
                piRef: 'Account',
                business: dto.business.toHexString(),
                currency: dto.currency,
            },
            options,
        );
    }

    async updateOverdraft(
        balanceId: Types.ObjectId,
        amount: number,
        approvalId: Types.ObjectId,
        options?: ExecutionOptions,
    ): Promise<Types.ObjectId> {
        if (options?.dryRun) {
            return new Types.ObjectId();
        }

        const dto: UpdateOverdraftRequestDto = {
            tenant: toISVServerTenant(this.request),
            id: balanceId.toHexString(),
            overdraftLimit: amount,
            source: approvalId.toHexString(),
            sourceRef: 'Approval',
        };
        const res = await firstValueFrom(this.grpcService.updateOverdraft(dto));

        if (res.code === AppStatus.Success) {
            return new Types.ObjectId(res.data.balanceId);
        }

        throw BalanceException.ISV_SERVICE_ERROR(res);
    }

    async createReserveAccountBalance(
        dto: CreateReserveAccountBalanceDto,
        options?: ExecutionOptions,
    ): Promise<Types.ObjectId> {
        return this.createBalance(
            {
                tenant: toISVServerTenant(this.request),
                pi: dto.reserveAccount.toString(),
                piRef: 'ReserveAccount',
                currency: dto.currency,
            },
            options,
        );
    }

    async findAndVerify(entityId: string | Types.ObjectId): Promise<GetBalanceResponse> {
        const res = await firstValueFrom(
            this.grpcService.getBalance({
                tenant: toISVServerTenant(this.request),
                id: entityId.toString(),
            }),
        );

        if (res.code === AppStatus.Success) {
            return res.data;
        }

        throw BalanceException.ISV_SERVICE_ERROR(res);
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

    getHistory(balanceId: Types.ObjectId, query: APIPagingDto) {
        return this.historyRepo.findByQuery(query, { '_meta.origId': balanceId });
    }

    async generateHistoryEntries(balanceId: Types.ObjectId, query: APIPagingDto): Promise<BalanceHistoryEntry[]> {
        const defaultConditions = { '_meta.origId': balanceId };
        let { conditions } = MongoAPIPaging.getPagingConstraints(query, defaultConditions);

        conditions = Utils.renameKey(conditions, 'createdAt', '_meta.txTime');

        const pipeline = getBalanceHistoryPipeline(conditions);
        const res = await this.historyRepo.aggregate(pipeline);

        return res.map((doc) => buildBalanceHistoryData(doc));
    }
}
