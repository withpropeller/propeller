import { Module } from '@nestjs/common';
import { User, UserSchema } from './user.schema';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { TenantDataSource } from '@core/helpers/enums';
import { UserConsumer } from './user.consumer';
import { CommonModule } from '@common/common.module';
import { UsersController } from './users.controller';

@Module({
    imports: [
        CommonModule,
        HttpModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], TenantDataSource.Core),
    ],
    controllers: [UsersController],
    providers: [UsersService, UserConsumer],
    exports: [UsersService],
})
export class UsersModule {}
