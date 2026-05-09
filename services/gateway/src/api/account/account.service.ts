import { Business } from '@api/business/business.schema';
import { InfraApiService } from '@common/api-service/infra-api.service';
// gRPC removed
import { ConfigService } from '@config/config.service';
import { Repository, RepositoryFactory } from '@core/abstracts/repository';
import { AppException } from '@core/exceptions';
import {
    AppStatus,
    GetTenantDataSource,
    ModelIdTag,
    TagMongoId,
    TenantDataSource,
    TenantRequestPayload,
} from '@core/helpers';
import { ReporterService } from '@common/services/reporter.service';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AccountCurrency, AccountType } from './account.enums';
import { AccountException } from './account.exception';
import { Account } from './accounts.schema';
import { RequestOverdraftDto } from './account.dto';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class AccountService extends InfraApiService {
    public repo: Repository<Account>;

    constructor(
        @Inject(REQUEST) request: TenantRequestPayload,
        http: HttpService,
        config: ConfigService,
        private moduleRef: ModuleRef,
        private reporter: ReporterService,
    ) {
        super(http, request, config, '/accounts');
        const model = this.moduleRef.get(getModelToken(Account.name, GetTenantDataSource(request)), { strict: false });
        this.repo = RepositoryFactory<Account>(model);
    }

    public async createDefaultMainAccount(business: HydratedDocument<Business>, accountName: string) {
        // gRPC account creation removed — in MOR, accounts are created via Flo/TigerBeetle
        const count = await this.repo.count({ business: business.id });
        if (count > 0) return;

        const entity = {
            name: accountName,
            default: true,
            type: AccountType.Main,
            business,
            currency: AccountCurrency.NGN,
        };
        return this.repo.createAndSave(entity);
    }

    async requestCreditLimitApproval(_userPublicId: string, _accountId: string, _data: RequestOverdraftDto) {
        throw AppException.BAD_REQUEST.setMessage('Credit limit not supported in MOR');
    }
}

