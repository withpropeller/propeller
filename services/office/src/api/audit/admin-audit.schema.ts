import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { ModelSchemaOptions, Utils } from '@core/helpers';
import { AuditAction, AuditObjectModel } from './audit.enums';
import { AuditSourceSchema, AuditSource } from './audit.schema';
import { Admin } from '@api/admins/admin.schema';
import { ExecutionOptions } from '@common/interfaces';
import { Request } from 'express';

export interface AuditParams {
    action: AuditAction;
    object?: Types.ObjectId;
    objectRef?: AuditObjectModel;
    actor: Admin;
    req: Request;
    data?: any;
    message?: string;
    options?: ExecutionOptions;
}

@Schema(
    ModelSchemaOptions({
        objectIds: ['actor', 'objectRef:#objectRef'],
    }),
)
export class AdminAudit {
    // The action taken
    @Prop({
        type: String,
        enum: Utils.enumToArray(AuditAction),
        required: true,
    })
    action: AuditAction;

    // Id of the object the action was performed on
    @Prop({ type: Types.ObjectId, refPath: 'objectRef' })
    object?: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AuditObjectModel),
    })
    objectRef?: string;

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

export const AdminAuditSchema = SchemaFactory.createForClass(AdminAudit);
