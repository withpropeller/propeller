import { TenantDataSource } from '@core/helpers';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';
import { Repository } from '@core/abstracts/repository';
import { BusinessKYC } from './business-kyc.schema';
import { GetTenantDataSource, TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { BusinessException } from './business.exception';

@Injectable()
export class BusinessKYCService extends Repository<BusinessKYC> {
    constructor(
        @InjectModel(BusinessKYC.name, TenantDataSource.Core)
        model: Model<HydratedDocument<BusinessKYC>>,
    ) {
        super(model);
    }

    async safeGet(businessId: string, request: TenantRequestPayload) {
        const kyc = await this.findOne({ business: businessId }, true);
        const dataSource = GetTenantDataSource(request);

        if (!kyc && dataSource === TenantDataSource.Live) {
            throw BusinessException.KycNotCompleted;
        }

        return kyc;
    }
}
