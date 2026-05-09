import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business, BusinessEntity, RFC7807Exception, MongoAPIPaging } from '@propeller/core';
import type { ListBusinessesDto } from './dto/list-businesses.dto.js';
import type { ApproveBusinessDto } from './dto/approve-business.dto.js';
import type { BusinessDetailDto } from './dto/business-detail.dto.js';

const DEFAULT_LIMIT = 20;

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    @InjectModel(BusinessEntity.name) private readonly entityModel: Model<BusinessEntity>,
  ) {}

  async listBusinesses(query: ListBusinessesDto): Promise<BusinessDetailDto[]> {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.kybStatus) {
      // kybStatus lives on entity, handled below via merge
      (filter as Record<string, unknown>)['kybStatus'] = query.kybStatus;
    }

    const { conditions, select, sort, limit } = MongoAPIPaging.toConstraint(query);
    // Merge our status/kybStatus filters with the paging conditions
    const mergedConditions = { ...filter, ...conditions };

    const businesses = await this.businessModel
      .find(mergedConditions, select)
      .sort(sort)
      .limit(limit)
      .exec();

    const results: BusinessDetailDto[] = [];
    for (const business of businesses) {
      const entity = await this.entityModel.findOne({ business: business._id }).exec();
      results.push(this.toDetailDto(business, entity ?? undefined));
    }
    return results;
  }

  async getBusinessDetail(id: string): Promise<BusinessDetailDto> {
    const business = await this.businessModel.findById(id).exec();
    if (!business) {
      throw RFC7807Exception.businessNotFound(id);
    }
    const entity = await this.entityModel.findOne({ business: business._id }).exec();
    return this.toDetailDto(business, entity ?? undefined);
  }

  async approveBusiness(id: string, dto: ApproveBusinessDto): Promise<BusinessDetailDto> {
    const business = await this.businessModel.findById(id).exec();
    if (!business) {
      throw RFC7807Exception.businessNotFound(id);
    }

    const entity = await this.entityModel.findOneAndUpdate(
      { business: business._id },
      { status: dto.action === 'approved' ? 'approved' : dto.action === 'rejected' ? 'rejected' : 'manual-review' },
      { new: true },
    ).exec();

    if (!entity) {
      throw RFC7807Exception.businessNotFound(id);
    }

    return this.toDetailDto(business, entity);
  }

  private toDetailDto(business: Business, entity?: BusinessEntity): BusinessDetailDto {
    return {
      id: business._id.toString(),
      name: business.name,
      country: entity?.countryCode ?? '',
      status: business.status,
      kybStatus: entity?.status ?? 'new',
      paykkaMerchId: entity?.partnerCustomerId,
      paykkaRawResponse: entity?.partnerSetup?.metadata,
      createdAt: (business as any).createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
