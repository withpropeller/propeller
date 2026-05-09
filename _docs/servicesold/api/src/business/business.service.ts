import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Business, BusinessEntity, RFC7807Exception } from '@propeller/core';
import type { CreateBusinessDto } from './dto/create-business.dto.js';
import type { BusinessResponseDto } from './dto/business-response.dto.js';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    @InjectModel(BusinessEntity.name) private readonly entityModel: Model<BusinessEntity>,
  ) {}

  async create(dto: CreateBusinessDto): Promise<BusinessResponseDto> {
    const business = new this.businessModel({
      name: dto.name,
      status: 'pending',
      owner: new Types.ObjectId(), // placeholder — real auth in Wave 3
    });
    await business.save();

    const entity = new this.entityModel({
      business: business._id,
      name: dto.name,
      countryCode: dto.country,
      currencySupported: 'NGN',
      status: 'new',
      registrationNumber: dto.registrationNumber,
    });
    await entity.save();

    return this.toResponse(business, entity);
  }

  async findOne(id: string): Promise<BusinessResponseDto> {
    const business = await this.businessModel.findById(id).exec();
    if (!business) {
      throw RFC7807Exception.businessNotFound(id);
    }
    const entity = await this.entityModel.findOne({ business: business._id }).exec();
    return this.toResponse(business, entity ?? undefined);
  }

  async getBalance(id: string): Promise<{ available: number; currency: string }> {
    // Wave 2 stub — will query TB ledger in later slice
    return { available: 0, currency: 'NGN' };
  }

  private toResponse(
    business: Business,
    entity?: BusinessEntity,
  ): BusinessResponseDto {
    return {
      id: business._id.toString(),
      name: business.name,
      country: entity?.countryCode ?? '',
      status: business.status,
      kybStatus: entity?.status ?? 'new',
      paykkaMerchId: entity?.partnerCustomerId,
      createdAt: (business as any).createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
