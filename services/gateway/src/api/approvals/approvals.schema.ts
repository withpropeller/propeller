import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ModelSchemaOptions, Utils } from '@core/helpers';
import { User } from '@api/users';
import { Business } from '@api/business/business.schema';
import { AWSObjectURL } from '@common/models/aws-object';

export type ApprovalDocument = Approval & Document;

export enum ApprovalTypes {
    BusinessAccount = 'business-account',
}

export enum ApprovalStatus {
    Approved = 'approved',
    Pending = 'pending',
    Processing = 'processing',
    Cancelled = 'cancelled',
    Declined = 'declined',
    Flagged = 'flagged',
    Failed = 'failed',
}

@Schema(ModelSchemaOptions({ timestamps: true }))
export class ApprovalData {
    @Prop()
    amount?: number;

    @Prop()
    remarks?: string;

    @Prop({ type: AWSObjectURL, _id: false })
    accountStatement?: AWSObjectURL;
}

export const ApprovalDataSchema = SchemaFactory.createForClass(ApprovalData);

@Schema(ModelSchemaOptions(['approver']))
export class ApprovalDecision {
    // User Id of user that the approval was assigned to
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    approver: User;

    @Prop({ type: String, enum: Utils.enumToArray(ApprovalStatus), default: ApprovalStatus.Pending })
    status: ApprovalStatus;

    @Prop({ type: Date })
    date: Date;

    @Prop()
    remarks: string;
}

export const ApprovalDecisionSchema = SchemaFactory.createForClass(ApprovalDecision);

@Schema(ModelSchemaOptions(['requestedBy', 'assignedTo', 'systemApprover', 'business'], '-systemApprover'))
export class Approval {
    // Type of approval;
    @Prop({ type: String, enum: Utils.enumToArray(ApprovalTypes) })
    type: ApprovalTypes;

    @Prop({ type: ApprovalDataSchema, _id: false })
    data: ApprovalData;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    requestedBy: User;

    // User Id of Admin that approved if it needs admin approval
    @Prop({ type: MongooseSchema.Types.ObjectId })
    systemApprover: MongooseSchema.Types.ObjectId;

    // Account status of the user - this gives more context to status of a user
    @Prop({ type: String, enum: Utils.enumToArray(ApprovalStatus), default: ApprovalStatus.Pending })
    status: ApprovalStatus;

    // Business that requested
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: Business;

    publicId: string;
}

export const ApprovalSchema = SchemaFactory.createForClass(Approval);
