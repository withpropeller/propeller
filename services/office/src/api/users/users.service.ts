import { Injectable } from '@nestjs/common';
import { TenantDataSource } from '@core/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { User } from './user.schema';
import { Repository } from '@core/abstracts/repository';
import { MongoAPIPaging } from '@common/api-paging';

@Injectable()
export class UsersService extends Repository<User> {
    constructor(
        @InjectModel(User.name, TenantDataSource.Core)
        model: Model<HydratedDocument<User>>,
    ) {
        super(model);
    }

    async orgMemberCount(organizationId: string) {
        const organization = new Types.ObjectId(organizationId);

        const { conditions } = MongoAPIPaging.getPagingConstraints({}, { organization });

        return await this.model.find(conditions).count().exec();
    }
}
