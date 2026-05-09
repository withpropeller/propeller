import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';
import { ModelSchemaOptions, enumProp, objectRefPropRequired } from '../mongo.utils.js';
import { ModelIdTag } from '../mongo.enums.js';

export type BusinessDocument = HydratedDocument<Business>;

export enum BusinessStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

@Schema(
  ModelSchemaOptions({
    objectIds: ['owner'],
    tag: ModelIdTag.Business,
    collection: 'businesses',
  }),
)
export class Business {
  @Prop({ type: Types.ObjectId, auto: true })
  _id!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop(enumProp(BusinessStatus, BusinessStatus.PENDING))
  status!: BusinessStatus;

  @Prop(objectRefPropRequired('User'))
  owner!: Types.ObjectId;

  @Prop()
  infraId?: string;

  @Prop({ type: Object })
  restrictions?: { pnd: boolean };

  @Prop({ type: Object })
  config?: { email: string; ccEmails: string[] };
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
