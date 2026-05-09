import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Business, BusinessSchema, BusinessEntity, BusinessEntitySchema } from '@propeller/core';
import { BusinessController } from './business.controller.js';
import { BusinessService } from './business.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
      { name: BusinessEntity.name, schema: BusinessEntitySchema },
    ]),
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
