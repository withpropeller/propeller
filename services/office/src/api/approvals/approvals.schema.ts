import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { User } from '@api/users';
import { Business } from '@api/business/business.schema';
import { AWSObjectURL } from '@common/models/aws-object';
import { Account } from '@api/account/accounts.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export type ApprovalDocument = Approval & Document;

export enum ApprovalTypes {
    BusinessAccount = 'business-account',
    CreditLimit = 'credit-limit',
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

@Schema(ModelSchemaOptions(['transaction', 'wallet', 'card'], null, false))
export class ApprovalData {
    @Prop()
    @ApiPropertyOptional({ description: 'Approval amount', type: Number })
    amount?: number;

    @Prop()
    @ApiPropertyOptional({ description: 'Remarks on the approval data' })
    remarks?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    @ApiPropertyOptional({ description: 'Related account ID', type: String })
    account?: Account;

    @Prop({ type: AWSObjectURL, _id: false })
    @ApiPropertyOptional({ description: 'Account statement S3 object' })
    accountStatement?: AWSObjectURL;
}

export const ApprovalDataSchema = SchemaFactory.createForClass(ApprovalData);

@Schema(ModelSchemaOptions(['approver']))
export class ApprovalDecision {
    // User Id of user that the approval was assigned to
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    @ApiProperty({ description: 'Approver user ID', type: String })
    approver: User;

    @Prop({
        type: String,
        enum: Utils.enumToArray(ApprovalStatus),
        default: ApprovalStatus.Pending,
    })
    @ApiProperty({ description: 'Decision status', enum: ApprovalStatus })
    status: ApprovalStatus;

    @Prop({ type: Date })
    @ApiPropertyOptional({ description: 'Date of decision', type: Date })
    date: Date;

    @Prop()
    @ApiPropertyOptional({ description: 'Decision remarks' })
    remarks: string;
}

export const ApprovalDecisionSchema = SchemaFactory.createForClass(ApprovalDecision);

@Schema(
    ModelSchemaOptions({
        objectIds: ['requestedBy:usr', 'systemApprover:adm', 'business:bz'],
        tag: ModelIdTag.Approval,
    }),
)
export class Approval {
    // Type of approval;
    @Prop({ type: String, enum: Utils.enumToArray(ApprovalTypes) })
    @ApiProperty({ description: 'Approval type', enum: ApprovalTypes })
    type: ApprovalTypes;

    @Prop({ type: ApprovalDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Approval data payload', type: ApprovalData })
    data: ApprovalData;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    @ApiProperty({ description: 'User who requested the approval', type: String })
    requestedBy: User;

    // User Id of Admin that approved if it needs admin approval
    @Prop({ type: MongooseSchema.Types.ObjectId })
    @ApiPropertyOptional({ description: 'System approver admin ID', type: String })
    systemApprover: MongooseSchema.Types.ObjectId;

    // Account status of the user - this gives more context to status of a user
    @Prop({
        type: String,
        enum: Utils.enumToArray(ApprovalStatus),
        default: ApprovalStatus.Pending,
    })
    @ApiProperty({ description: 'Approval status', enum: ApprovalStatus })
    status: ApprovalStatus;

    // Business that reqeuested
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    @ApiProperty({ description: 'Business that requested the approval', type: String })
    business: Business;

    publicId: string;
}

export const ApprovalSchema = SchemaFactory.createForClass(Approval);
export const ApiHydratedApproval = ApiHydrated(Approval);
