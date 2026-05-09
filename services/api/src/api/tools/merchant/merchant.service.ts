import { Injectable } from '@nestjs/common';
import { HydratedDocument, Model } from 'mongoose';
import { APIPagingDto } from '@common/api-paging';
import { Merchant } from './merchant.schema';
import { Repository } from '@core/abstracts';
import { TenantDataSource } from '@core/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { MerchantCategoriesList } from './merchant.enum';

@Injectable()
export class MerchantService extends Repository<Merchant> {
    constructor(
        @InjectModel(Merchant.name, TenantDataSource.Core) readonly model: Model<HydratedDocument<Merchant>>,
    ) {
        super(model);
    }

    async fetchCachedMerchants(query: APIPagingDto) {
        return this.findByQuery(query);
    }

    async getMerchantCategories() {
        return MerchantCategoriesList;
    }
}
