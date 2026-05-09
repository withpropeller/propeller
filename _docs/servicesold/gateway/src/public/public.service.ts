import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Business, BusinessEntity, User, RFC7807Exception } from '@propeller/core';
import type { SignupDto } from './dto/signup.dto.js';
import type { CreateBusinessDto } from './dto/create-business.dto.js';
import type { SubmitBusinessDto } from './dto/submit-business.dto.js';
import type { UserResponseDto } from './dto/user-response.dto.js';
import type { BusinessResponseDto } from './dto/business-response.dto.js';

interface UploadedFile {
  fileName: string;
  /** PayKKa file_id after upload (stub until flo picks up) */
  fileId: string;
  uploadedAt: string;
}

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    @InjectModel(BusinessEntity.name) private readonly entityModel: Model<BusinessEntity>,
  ) {}

  async signup(dto: SignupDto): Promise<UserResponseDto> {
    const existing = await this.userModel.findOne({ email: dto.email }).exec();
    if (existing) {
      throw RFC7807Exception.badRequest('Email already registered');
    }

    const user = new this.userModel({
      email: dto.email,
      passwordHash: dto.password, // TODO: hash password properly
      status: 'pending',
    });
    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      status: user.status,
    };
  }

  async createBusiness(dto: CreateBusinessDto): Promise<BusinessResponseDto> {
    const business = new this.businessModel({
      name: dto.name,
      status: 'pending',
      owner: new Types.ObjectId(),
    });
    await business.save();

    const entity = new this.entityModel({
      business: business._id,
      name: dto.name,
      countryCode: dto.country,
      currencySupported: 'NGN',
      status: 'draft',
      registrationNumber: dto.registrationNumber,
    });
    await entity.save();

    return this.toBusinessResponse(business, entity);
  }

  async uploadDocuments(id: string, body: Record<string, unknown>): Promise<{ fileId: string }> {
    const entity = await this.entityModel.findOne({ business: new Types.ObjectId(id) }).exec();
    if (!entity) {
      throw RFC7807Exception.businessNotFound(id);
    }

    const fileName = String(body.fileName ?? 'document.pdf');
    const fileData = String(body.fileData ?? ''); // base64 content
    if (!fileData) {
      throw RFC7807Exception.badRequest('fileData is required (base64-encoded)');
    }

    const uploadedFiles = (entity._meta?.uploadedFiles as UploadedFile[]) ?? [];
    const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    uploadedFiles.push({ fileName, fileId, uploadedAt: new Date().toISOString() });

    await this.entityModel.updateOne(
      { _id: entity._id },
      {
        $set: {
          '_meta.uploadedFiles': uploadedFiles,
          status: 'files-uploading',
        },
      },
    );

    this.logger.log(`Document uploaded for business ${id}: ${fileName} -> ${fileId}`);
    return { fileId };
  }

  async submitBusiness(id: string, dto: SubmitBusinessDto): Promise<BusinessResponseDto> {
    const business = await this.businessModel.findById(id).exec();
    if (!business) {
      throw RFC7807Exception.businessNotFound(id);
    }

    const entity = await this.entityModel.findOne({ business: business._id }).exec();
    if (!entity) {
      throw RFC7807Exception.businessNotFound(id);
    }

    const files = (entity._meta?.uploadedFiles as UploadedFile[]) ?? [];
    this.logger.log(`Submitting KYB for business ${id} with ${files.length} uploaded files`);

    // Mark status as submitted. The Go core service's flo handler
    // (SubmitKyb) picks up the kyb.submitted event and calls PayKKa.
    const updated = await this.entityModel.findOneAndUpdate(
      { business: business._id },
      {
        $set: {
          status: 'submitted',
          '_meta.submittedAt': new Date().toISOString(),
        },
      },
      { new: true },
    ).exec();

    return this.toBusinessResponse(business, updated ?? entity);
  }

  private toBusinessResponse(
    business: Business,
    entity: BusinessEntity,
    authorizeLink?: string,
  ): BusinessResponseDto {
    return {
      id: business._id.toString(),
      name: business.name,
      country: entity.countryCode,
      status: business.status,
      kybStatus: entity.status,
      paykkaMerchId: entity.partnerCustomerId,
      authorizeLink,
      createdAt: (business as any).createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
