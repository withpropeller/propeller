import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ModelSchemaOptions, Utils } from '@core/helpers';

export type AuditDocument = Audit & Document;

export enum AuditAction {
    SecretKeyCreate = 'secret-key.create',
    SecretKeyDelete = 'secret-key.delete',
    SecretKeyUpdate = 'secret-key.update',
    SecretKeyTerminate= 'secret-key.terminate',

    CardProgramCreate = 'card-program.create',
    CardProgramDelete = 'card-program.delete',

    WebhookCreate = 'webhook.create',
    WebhookDelete = 'webhook.delete',
    WebhookReadSecret = 'webhook.read.secret',

    ShippingAddressCreate = 'shipping.create',
    ShippingAddressDelete = 'shipping.delete',
}

export enum AuditObjectModel {
    AccessKey = 'AccessKey',
    CardProgram = 'CardProgram',
    Webhook = "Webhook",
    ShippingAddress = 'ShippingAddress',
}

@Schema()
export class AuditSource {
    @Prop({ required: true })
    ipAddress: string;

    @Prop(raw({}))
    client?: any;

    @Prop(raw({}))
    os?: any;

    @Prop(raw({}))
    device?: any;

    @Prop(raw({}))
    bot?: any

    @Prop(raw({}))
    location?: any;
}
export const AuditSourceSchema = SchemaFactory.createForClass(AuditSource);

@Schema(ModelSchemaOptions(['actor', 'business']))
export class Audit {
    // Business that requested
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: any;

    // The action taken
    @Prop({
        type: String,
        enum: Utils.enumToArray(AuditAction),
        required: true,
    })
    action: AuditAction;

    // Id of the object the action was performed on
    @Prop({ type: Types.ObjectId, refPath: 'objectModel' })
    object: Types.ObjectId;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AuditObjectModel),
        required: true,
    })
    objectModel: AuditObjectModel;

    @Prop(raw({}))
    data?: any;

    // The Approval that granted it
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    actor?: any;

    @Prop({ type: AuditSourceSchema, _id: false })
    source?: AuditSource;

    @Prop(raw({}))
    metadata?: any;
}

export const AuditSchema = SchemaFactory.createForClass(Audit);
