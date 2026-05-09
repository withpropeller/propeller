import { TenantDataSource } from '@core/helpers';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument, Types } from 'mongoose';
import { Business } from './business.schema';
import { Repository } from '@core/abstracts/repository';
import { GetTenantDataSource, TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { BusinessStatus } from './business.enums';
import { BusinessException } from './business.exception';

@Injectable()
export class BusinessService extends Repository<Business> {
    constructor(
        @InjectModel(Business.name, TenantDataSource.Core)
        model: Model<HydratedDocument<Business>>,
    ) {
        super(model);
    }

    async safeGet(businessId: Types.ObjectId, request: TenantRequestPayload) {
        const business = await this.findOneById(businessId);
        const dataSource = GetTenantDataSource(request);

        if (dataSource === TenantDataSource.Live && business.status !== BusinessStatus.APPROVED) {
            throw BusinessException.BusinessNotApproved;
        }

        return business;
    }
}
