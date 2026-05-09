import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';
import { ModelSchemaOptions, enumProp, objectRefProp } from '../mongo.utils.js';
import { ModelIdTag } from '../mongo.enums.js';

export type UserDocument = HydratedDocument<User>;

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Schema(
  ModelSchemaOptions({
    objectIds: ['business'],
    redact: ['passwordHash'],
    tag: ModelIdTag.User,
    collection: 'users',
  }),
)
export class User {
  @Prop({ type: Types.ObjectId, auto: true })
  _id!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop(objectRefProp('Business'))
  business?: Types.ObjectId;

  @Prop(enumProp(UserStatus, UserStatus.PENDING))
  status!: UserStatus;

  @Prop()
  emailVerifiedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
