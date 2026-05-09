import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { AccessKey } from '@core/interfaces';
import { BusinessService } from '@models/business/business.service';
import { AccountService } from '@api/account/account.service';
import { Fee } from './fee.schema';
import { Utils } from '@core/helpers';
import { CreateFeeDto } from './fee.dto';
import { AccountType } from '@api/account/account.enums';
import { FeeException } from './fee.exception';
import { HydratedDocument, Types } from 'mongoose';
import { FeeStatus } from './fee.enums';
import { toAccountCurrency } from '@api/balance/balance.utils';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class FeeService {
    public repo: Repository<Fee>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private businessService: BusinessService,
        private accountService: AccountService,
    ) {
        const model = this.moduleRef.get(getModelToken(Fee.name, GetTenantDataSource(this.request)), { strict: false });
        this.repo = RepositoryFactory<Fee>(model);
    }

    async safeGet(businessId: Types.ObjectId, id: string, currency?: string): Promise<HydratedDocument<Fee>> {
        const fee = await this.repo.findOne({ _id: id, business: businessId });

        if (fee.status !== FeeStatus.Active) {
            throw FeeException.NotActive;
        }

        if (currency && fee.currency !== currency) {
            throw FeeException.InvalidCurrency;
        }

        return fee;
    }

    async createFee(data: CreateFeeDto, key: AccessKey) {
        const business = await this.businessService.safeGet(key.businessId, this.request);
        const account = await this.accountService.safeGet(business.id, data.account, toAccountCurrency(data.currency));

        if (account.type != AccountType.Main) {
            throw FeeException.InvalidAccountType;
        }

        const entity = Utils.removeNilValues({
            business: business.id,
            account: account.id,
            name: data.name,
            description: data.description,
            structure: data.structure,
            value: data.value,
            cap: data.cap,
            currency: data.currency,
            metadata: data.metadata,
        });

        return this.repo.createAndSave(entity);
    }
}
