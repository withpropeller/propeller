import { BusinessService } from '@api/business/business.service';
import { Repository } from '@core/abstracts';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { KYCBusinessInformationDto, KYCBusinessAddressDto, KYCLeadershipDto } from './kyc-dto';
import { BusinessKYC, KYCWizardDocument } from './business-kyc.schema';
import { StorageService } from '@common/integrations/storage.service';
import { AWSObjectURL } from '@common/models/aws-object';
import { TenantDataSource } from '@core/helpers';
import { FloService } from '@core/services/flo.service';
import { KybStatus } from '@api/business/business.enums';
import { BusinessKYCStatus } from './business-kyc.enum';

@Injectable()
export class KYCWizardService extends Repository<BusinessKYC> {
    constructor(
        @InjectModel(BusinessKYC.name, TenantDataSource.Core) model: Model<HydratedDocument<KYCWizardDocument>>,
        private readonly businessService: BusinessService,
        private readonly storageService: StorageService,
        private readonly flo: FloService,
    ) {
        super(model);
    }

    async createKYC(id: Types.ObjectId, body: KYCBusinessInformationDto) {
        const business = await this.businessService.findById(id);
        const businessKyc = await this.findOne({ business: business._id }, true);

        if (!businessKyc) {
            const result = await this.createAndSave({ business, businessInformation: body as any });
            await this.businessService.updateById(business.id, { kyc: result });
            return result;
        }

        return this.findOneAndUpdate({ _id: businessKyc._id }, { $set: { businessInformation: body as any } });
    }

    async updateBusinessInfo(businessId: Types.ObjectId, id: Types.ObjectId, body: KYCBusinessInformationDto) {
        const businessKyc = await this.findOne({ _id: id, business: businessId });

        return this.findOneAndUpdate({ _id: businessKyc._id }, { $set: { businessInformation: body as any } });
    }

    async updateBusinessAddress(businessId: Types.ObjectId, id: Types.ObjectId, body: KYCBusinessAddressDto) {
        const businessKyc = await this.findOne({ _id: id, business: businessId });
        const business = await this.businessService.findById(businessKyc.business as unknown as Types.ObjectId);

        await this.businessService.updateById(business.id, { email: body.email });
        return this.findOneAndUpdate({ _id: businessKyc._id }, { $set: { businessAddress: body as any } });
    }

    async addLeadership(businessId: Types.ObjectId, id: Types.ObjectId, body: KYCLeadershipDto) {
        const businessKyc = await this.findOne({ _id: id, business: businessId });
        const exists = businessKyc.leadership.find((v) => v.bvn === body.bvn);

        if (exists) {
            throw new BadRequestException('Director with Identification already exists');
        }

        // BVN is stored; identity verification is performed by PayKKa during KYB
        const entity = { ...body };

        return this.findOneAndUpdate({ _id: businessKyc._id }, { $addToSet: { leadership: entity as any } });
    }

    async deleteLeadership(businessId: Types.ObjectId, id: Types.ObjectId, leadershipId: Types.ObjectId) {
        const businessKyc = await this.findOne({ _id: id, business: businessId });

        const toDelete = businessKyc.leadership.find((v) => (v as any)._id.toString() === leadershipId);

        if (toDelete) {
            const arr = businessKyc.leadership.filter((v) => (v as any)._id.toString() !== leadershipId);

            return this.updateById(businessKyc.id, { $set: { leadership: arr } });
        }
    }

    async addDocumentations(
        businessId: Types.ObjectId,
        id: Types.ObjectId,
        cacCertificate: Express.Multer.File,
        applicationDoc: Express.Multer.File,
    ) {
        const businessKyc = await this.findOne({ _id: id, business: businessId });
        const cacCertificateAWS = await this.storageService.uploadFile(`business-docs/${businessId}`, cacCertificate);
        const applicationDocAWS = await this.storageService.uploadFile(`business-docs/${businessId}`, applicationDoc);

        const docs = {
            cacCertificate: cacCertificateAWS,
            applicationDoc: applicationDocAWS,
        };

        return this.findOneAndUpdate({ _id: businessKyc._id }, { $set: { documentation: docs as any } });
    }

    async updateDocumentations(
        businessId: Types.ObjectId,
        id: Types.ObjectId,
        cacCertificate: Express.Multer.File,
        applicationDoc: Express.Multer.File,
    ) {
        const businessKyc = await this.findOne({ _id: id, business: businessId });
        if (!businessKyc.documentation) {
            throw new BadRequestException('KYC Documentation do not exist');
        }

        //Update cacCertificate
        if (cacCertificate) {
            if (businessKyc.documentation.cacCertificate) {
                await this.deleteFile(businessKyc.documentation.cacCertificate);
            }

            businessKyc.documentation.cacCertificate = await this.storageService.uploadFile(
                `business-docs/${businessId}`,
                cacCertificate,
            );
        }

        //Update applicationDoc
        if (applicationDoc) {
            if (businessKyc.documentation.applicationDoc) {
                await this.deleteFile(businessKyc.documentation.applicationDoc);
            }

            businessKyc.documentation.applicationDoc = await this.storageService.uploadFile(
                `business-docs/${businessId}`,
                applicationDoc,
            );
        }

        return this.findOneAndUpdate({ _id: businessKyc._id }, { $set: { documentation: businessKyc.documentation } });
    }

    private deleteFile(object: AWSObjectURL) {
        return this.storageService.deleteDocument(object.keyName);
    }

    async submitKyc(businessId: Types.ObjectId, kycId: Types.ObjectId) {
        const businessKyc = await this.findOne({ _id: kycId, business: businessId });

        // Guard: validate KYC completeness before submission
        if (!businessKyc.businessInformation) {
            throw new BadRequestException('Business information is required before submission');
        }
        if (!businessKyc.businessAddress) {
            throw new BadRequestException('Business address is required before submission');
        }
        if (!businessKyc.leadership || businessKyc.leadership.length === 0) {
            throw new BadRequestException('At least one director/legal rep is required before submission');
        }
        if (!businessKyc.documentation?.cacCertificate || !businessKyc.documentation?.applicationDoc) {
            throw new BadRequestException('All required documents must be uploaded before submission');
        }

        // Mark KYC as submitted
        businessKyc.status = BusinessKYCStatus.Submitted;
        await this.updateById(businessKyc._id, { $set: { status: BusinessKYCStatus.Submitted } });

        // Append event to business-events stream — compliance worker picks it up
        await this.flo.append('business-events', {
            type: 'business.kyc-submitted',
            payload: { businessId },
        });

        return { kyb_status: KybStatus.Submitted };
    }
}
