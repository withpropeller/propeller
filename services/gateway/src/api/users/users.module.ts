import { Module } from '@nestjs/common';
import { User, UserSchema } from './user.schema';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { TenantDataSource } from '@core/helpers/enums';

import { CommonModule } from '@common/common.module';

@Module({
    imports: [
        HttpModule,
        CommonModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], TenantDataSource.Core),
    ],
    exports: [UsersService],
})
export class UsersModule {}
