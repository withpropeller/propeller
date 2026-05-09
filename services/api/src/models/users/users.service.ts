import { Injectable } from '@nestjs/common';
import { TenantDataSource } from '@core/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { User } from './user.schema';
import { Repository } from '@core/abstracts/repository';

@Injectable()
export class UsersService extends Repository<User> {
    constructor(
        @InjectModel(User.name, TenantDataSource.Core)
        model: Model<HydratedDocument<User>>,
    ) {
        super(model);
    }
}
