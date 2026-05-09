import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { BusinessService } from '@models/business/business.service';
import { AccountService } from '@api/account/account.service';
import { AccountType } from '@api/account/account.enums';
import { Configuration } from './configuration.schema';
import { ConfigurationException } from './configuration.exception';
import { PaymentConfigurationDto } from './configuration.dto';
import { FeeService } from '@api/fees/fee.service';
import { HydratedDocument, Types } from 'mongoose';
import { Business } from '../../../models/business/business.schema';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ConfigurationService {
    public repo: Repository<Configuration>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private businessService: BusinessService,
        private accountService: AccountService,
        private feesService: FeeService,
    ) {
        const model = this.moduleRef.get(getModelToken(Configuration.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Configuration>(model);
    }

    async updatePayment(businessId: Types.ObjectId, dto: PaymentConfigurationDto) {
        const business = await this.businessService.safeGet(businessId, this.request);
        const configuration = await this.repo.findOne({
            business: business.id,
        });

        if (dto.payInAccount) {
            const account = await this.accountService.safeGet(business.id, dto.payInAccount);
            if (account.type != AccountType.Main) {
                throw ConfigurationException.InvalidAccountType;
            }
        }

        if (dto.payOutAccount) {
            const account = await this.accountService.safeGet(business.id, dto.payOutAccount);
            if (account.type != AccountType.Main) {
                throw ConfigurationException.InvalidAccountType;
            }
        }

        if (dto.fees && dto.fees.bankTransfer) {
            await this.feesService.repo.findOneById(dto.fees.bankTransfer);
        }

        if (dto.fees && dto.fees.billPayment) {
            await this.feesService.repo.findOneById(dto.fees.bankTransfer);
        }

        return this.repo.findOneAndUpdate({ _id: configuration.id }, { $set: { payment: dto } });
    }

    async get(business: HydratedDocument<Business>, select?: string): Promise<HydratedDocument<Configuration>> {
        return this.repo.findOne({ business: business.id }, true, select);
    }
}
