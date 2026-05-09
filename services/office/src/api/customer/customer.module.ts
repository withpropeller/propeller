import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { TenantDataSource } from '@core/helpers';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './customer.schema';
import { Business, BusinessSchema } from '@api/business/business.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }], TenantDataSource.Sandbox),
        MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }], TenantDataSource.Live),
    ],
    providers: [CustomerService],
    controllers: [CustomerController],
    exports: [CustomerService],
})
export class CustomerModule {}
