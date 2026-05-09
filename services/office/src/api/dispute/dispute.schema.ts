import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export enum DisputeReason {
    Fraudulent = 'fraudulent',
    Duplicate = 'duplicate',
    ValueNotReceived = 'value-not-received',
    General = 'general',
}

export enum DisputeStatus {
    New = 'new',
    UnderReview = 'under-review',
    AwaitingResponse = 'awaiting-response',
    Closed = 'closed',
    Resolved = 'resolved',
}

export enum DisputeTimelineAction {
    Created = 'created',
    Updated = 'updated',
    Closed = 'closed',
    Resolved = 'resolved',
    Expired = 'expired',
    Reopened = 'reopened',
}

export enum DisputeTimelineActorType {
    User = 'user',
    Customer = 'customer',
    System = 'system',
}

@Schema(
    ModelSchemaOptions({
        pick: 'url',
    }),
)
export class AWSObjectURL {
    @Prop()
    @ApiProperty({ description: 'S3 object key name' })
    keyName: string;

    @Prop()
    @ApiProperty({ description: 'S3 object URL' })
    url: string;

    @Prop({ type: Date, default: Date.now() })
    @ApiPropertyOptional({ description: 'Document created at', type: Date })
    createdAt?: string;
}

export const AWSObjectURLSchema = SchemaFactory.createForClass(AWSObjectURL);

@Schema(
    ModelSchemaOptions({
        objectIds: ['actor', 'admin', 'actor:#actorRef'],
        pick: '-admin -actorRef',
    }),
)
export class DisputeTimeline {
    @Prop({
        type: String,
        enum: Utils.enumToArray(DisputeTimelineAction),
        required: true,
    })
    @ApiProperty({ description: 'Timeline action', enum: DisputeTimelineAction })
    action: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(DisputeTimelineActorType),
        required: true,
    })
    @ApiProperty({ description: 'Actor type', enum: DisputeTimelineActorType })
    actorType: DisputeTimelineActorType;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'actorRef',
        required: true,
    })
    @ApiProperty({ description: 'Actor ID', type: String })
    actor: any;

    @Prop({ type: String, required: true })
    @ApiProperty({ description: 'Actor model reference name' })
    actorRef: string;

    @Exclude()
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admin' })
    admin?: any;

    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Timeline entry text' })
    text?: string;

    @Prop({ type: [{ type: AWSObjectURLSchema, _id: false }], default: void 0 })
    @ApiPropertyOptional({ description: 'Supporting documents', type: [AWSObjectURL] })
    documents?: AWSObjectURL[];
}
export const DisputeTimelineSchema = SchemaFactory.createForClass(DisputeTimeline);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz', 'customer:cu', 'source:#sourceRef'],
        pick: '-sourceRef',
        tag: ModelIdTag.Dispute,
    }),
)
export class Dispute {
    @Prop({ required: true })
    @ApiProperty({ description: 'Dispute amount in lowest currency unit', type: Number })
    amount: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Dispute currency', enum: TransactionCurrency })
    currency: TransactionCurrency;

    @Prop({
        type: String,
        enum: Utils.enumToArray(DisputeStatus),
        default: DisputeStatus.New,
    })
    @ApiPropertyOptional({ description: 'Dispute status', enum: DisputeStatus })
    status?: DisputeStatus;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'sourceRef',
        required: true,
        unique: true,
    })
    @ApiProperty({ description: 'Source document ID', type: String })
    source: any;

    @Prop({ type: String, required: true })
    @ApiProperty({ description: 'Source model reference name' })
    sourceRef: string;

    @Prop({
        type: [{ type: DisputeTimelineSchema }],
        _id: false,
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Dispute timeline entries', type: [DisputeTimeline] })
    timeline: DisputeTimeline[];

    @Prop({
        type: String,
        enum: Utils.enumToArray(DisputeReason),
        required: true,
    })
    @ApiPropertyOptional({ description: 'Dispute reason', enum: DisputeReason })
    reason?: DisputeReason;

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }],
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Related event IDs', type: [String] })
    events?: any[];

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;
}
export const DisputeSchema = SchemaFactory.createForClass(Dispute);
export const ApiHydratedDispute = ApiHydrated(Dispute);
