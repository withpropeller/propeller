import { Module } from '@nestjs/common';
import { User, UserSchema } from './user.schema';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { TenantDataSource } from '@core/helpers/enums';

import { CommonModule } from '@common/common.module';
import { RolesModule } from '@api/roles/roles.module';

@Module({
    imports: [
        HttpModule,
        CommonModule,
        RolesModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], TenantDataSource.Core),
    ],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
