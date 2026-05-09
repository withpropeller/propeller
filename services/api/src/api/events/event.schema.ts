import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Utils } from '@core/helpers';
import { ModelIdTag, ModelSchemaOptions } from '@core/mongo';
import { WebhookEventTypes } from '@api/webhooks/webhook.enums';
import { EventAttemptType } from './event.enums';

@Schema(
    ModelSchemaOptions({
        objectIds: ['business', 'event:evt', 'consumer:#consumerRef'],
        tag: ModelIdTag.EventAttempt,
        pick: '-business -consumerRef',
    }),
)
export class EventAttempt {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
    event: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'consumerRef' })
    consumer: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(EventAttemptType),
        required: true,
    })
    type: EventAttemptType;

    url?: string;

    @Prop()
    consumerRef: string;

    @Prop(raw({}))
    requestBody: any;

    @Prop(raw({}))
    responseBody: any;

    @Prop({ required: true })
    statusCode: number;

    @Prop()
    responseTime: number;

    @Prop({ type: Date })
    retryAt: Date;
}
export const EventAttemptSchema = SchemaFactory.createForClass(EventAttempt);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business', 'source:#sourceRef', 'attempts:evt.a'],
        tag: ModelIdTag.Event,
        pick: '-business -sourceRef',
    }),
)
export class Event {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(WebhookEventTypes),
        required: true,
    })
    type: WebhookEventTypes;

    @Prop({ default: false })
    sync?: boolean;

    @Prop(raw({}))
    body: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'sourceRef',
        required: true,
    })
    source: any;

    @Prop({ type: String, required: true })
    sourceRef: string;

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'EventAttempt' }],
    })
    attempts: EventAttempt[];
}
export const EventSchema = SchemaFactory.createForClass(Event);

/*
    @Prop({ required: true })
    url: string;
    
    @Prop({
        type: String,
        enum: Utils.enumToArray(ApiVersion),
        required: true,
    })
    apiVersion: ApiVersion;

        @Prop()
    latency: number; */
