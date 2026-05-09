import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { Configuration } from './configuration.schema';
import { HydratedDocument, Types } from 'mongoose';
import { Business } from '@api/business/business.schema';
import { Account } from '@api/account/accounts.schema';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ConfigurationService {
    public repo: Repository<Configuration>;

    constructor(@Inject(REQUEST) private request: TenantRequestPayload, private moduleRef: ModuleRef) {
        const model = this.moduleRef.get(getModelToken(Configuration.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Configuration>(model);
    }

    async create(business: HydratedDocument<Business>, mainAccount: HydratedDocument<Account>) {
        const count = await this.repo.count({ business: business.id });

        if (count > 0) {
            return;
        }

        const entity = {
            business: business.id,
            payment: {
                payInAccount: mainAccount.id,
                payOutAccount: mainAccount.id,
            },
        };
        return this.repo.createAndSave(entity);
    }
}
