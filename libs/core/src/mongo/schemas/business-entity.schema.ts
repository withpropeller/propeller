import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';
import { ModelSchemaOptions, enumProp, objectRefPropRequired, objectRefProp } from '../mongo.utils.js';
import { ModelIdTag } from '../mongo.enums.js';

export type BusinessEntityDocument = HydratedDocument<BusinessEntity>;

export enum KybStatus {
  NEW = 'new',
  STARTED = 'started',
  DRAFT = 'draft',
  FILES_UPLOADING = 'files-uploading',
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  IDENTITY_PENDING = 'identity-pending',
  UNDER_REVIEW = 'under-review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MANUAL_REVIEW = 'manual-review',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

@Schema(
  ModelSchemaOptions({
    objectIds: ['business', 'kyc'],
    tag: ModelIdTag.BusinessEntity,
    collection: 'business_entities',
  }),
)
export class BusinessEntity {
  @Prop({ type: Types.ObjectId, auto: true })
  _id!: Types.ObjectId;

  @Prop(objectRefPropRequired('Business'))
  business!: Types.ObjectId;

  @Prop()
  name?: string;

  @Prop({ required: true })
  countryCode!: string;

  @Prop({ required: true })
  currencySupported!: string;

  @Prop(objectRefProp('Kyc'))
  kyc?: Types.ObjectId;

  @Prop()
  partnerCustomerId?: string;

  @Prop({ type: Object })
  partnerSetup?: { setupDate: Date; partnerName: string; metadata: Record<string, unknown> };

  @Prop(enumProp(KybStatus, KybStatus.NEW))
  status!: KybStatus;

  @Prop()
  registrationNumber?: string;

  @Prop()
  taxIdentificationNumber?: string;

  @Prop()
  legalEntityName?: string;

  @Prop({ type: Object })
  regulatoryInfo?: Record<string, unknown>;

  @Prop({ type: Object })
  _meta?: Record<string, unknown>;
}

export const BusinessEntitySchema = SchemaFactory.createForClass(BusinessEntity);
