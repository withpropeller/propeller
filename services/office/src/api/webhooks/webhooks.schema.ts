import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ApiVersion, ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { WebhookEventTypes } from './webhook.enums';

export interface WebhookResponse<T = any> {
    responseBody: T;
    statusCode: number;
}

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz'],
        pick: '-secureSigningKey',
        tag: ModelIdTag.Webhook,
    }),
)
export class Webhook {
    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop({ default: false })
    disabled: boolean;

    @Prop({
        type: [String],
        enum: Utils.enumToArray(WebhookEventTypes),
        required: true,
    })
    events: WebhookEventTypes[];

    @Prop({
        type: String,
        enum: Utils.enumToArray(ApiVersion),
        default: ApiVersion.Current,
    })
    apiVersion: ApiVersion;

    @Prop({ required: true })
    url: string;

    @Prop({ required: true })
    secureSigningKey: Buffer;

    signingKey?: string;

    @Prop(raw({}))
    metadata?: Record<string, any>;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;
}
export const WebhookSchema = SchemaFactory.createForClass(Webhook);
