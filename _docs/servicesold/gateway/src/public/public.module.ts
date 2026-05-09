import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Business, BusinessSchema, BusinessEntity, BusinessEntitySchema, User, UserSchema } from '@propeller/core';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: BusinessEntity.name, schema: BusinessEntitySchema },
    ]),
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
