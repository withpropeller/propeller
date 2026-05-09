import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { enumPropRequired, ModelIdTag, ModelSchemaOptions } from '@core/mongo';
import { Schema as MongooseSchema } from 'mongoose';
import { parseQueryBoolean } from '@common/api-paging/utils';
import { APIRequestStatus } from './api-logs.enums';
import { REQUEST_REDACTION, RESPONSE_REDACTION } from './api-logs.utils';
import { AppStatus, Utils } from '@core/helpers';

export enum AuditSourceType {
    Api = 'api',
    Dashboard = 'dashboard',
}

export interface ApiLogsPayload {
    request: any;
    statusCode: number;
    latency: number;
    data: any;
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
    bot?: any;

    @Prop(raw({}))
    location?: any;
}
export const AuditSourceSchema = SchemaFactory.createForClass(AuditSource);

@Schema()
export class APIRequestAttempt {
    @Prop(raw({}))
    responseBody: any;

    @Prop({ required: true })
    statusCode: number;

    @Prop({ required: true })
    latency: number;

    @Prop({ required: true })
    createdAt: Date;
}
export const APIRequestAttemptSchema = SchemaFactory.createForClass(APIRequestAttempt);

@Schema(
    ModelSchemaOptions({
        objectIds: ['secretKey:sk', 'initiator:usr', 'events:evt'],
        pick: '-attempts -business -responseBody.stack',
        redact: [...RESPONSE_REDACTION, ...REQUEST_REDACTION],
        tag: ModelIdTag.Request,
    }),
)
export class ApiRequest {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business', index: true })
    business: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SecretKey' })
    secretKey: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    initiator: any;

    @Prop(enumPropRequired(APIRequestStatus))
    status: APIRequestStatus;

    @Prop({ required: true })
    path: string;

    @Prop({ required: true })
    method: string;

    @Prop(raw({}))
    query: any;

    @Prop(raw({}))
    requestBody: any;

    @Prop({ type: [{ type: APIRequestAttemptSchema, _id: false }] })
    attempts: APIRequestAttempt[];

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }],
        default: void 0,
    })
    events?: any[];

    @Prop({ required: true })
    apiVersion: string;

    @Prop({ type: AuditSourceSchema, _id: false })
    source?: AuditSource;

    @Prop({ type: AuditSourceSchema, _id: false })
    proxySource?: AuditSource;
}

export const ApiLogsSchema = SchemaFactory.createForClass(ApiRequest);

ApiLogsSchema.virtual('sourceType').get(function (this: ApiRequest) {
    return this.secretKey ? AuditSourceType.Api : AuditSourceType.Dashboard;
});

ApiLogsSchema.virtual('dryRun').get(function (this: ApiRequest) {
    return parseQueryBoolean(this.query?.dryRun);
});

ApiLogsSchema.virtual('responseBody').get(function (this: ApiRequest) {
    const lastAttempt = this.attempts?.[this.attempts.length - 1];

    if (lastAttempt?.responseBody && lastAttempt?.responseBody.code != AppStatus.BadRequest) {
        return Utils.pickKeys(lastAttempt.responseBody, '-error');
    }
    return lastAttempt?.responseBody;
});

ApiLogsSchema.virtual('statusCode').get(function (this: ApiRequest) {
    const lastAttempt = this.attempts?.[this.attempts.length - 1];
    return lastAttempt?.statusCode;
});

ApiLogsSchema.virtual('latency').get(function (this: ApiRequest) {
    const lastAttempt = this.attempts?.[this.attempts.length - 1];
    return lastAttempt?.latency;
});

ApiLogsSchema.virtual('secureRoute').get(function (this: ApiRequest) {
    const secureRoutesRegex = [
        new RegExp('(cards/[a-zA-Z0-9.]+/activate)$'),
        new RegExp('(cards/[a-zA-Z0-9.]+/secrets)$'),
        new RegExp('(cards/[a-zA-Z0-9.]+/reset-pin)$'),
        new RegExp('(cards/link)$'),
    ];
    return secureRoutesRegex.some((regex) => regex.test(this.path));
});

ApiLogsSchema.index({ business: 1, method: 1, statusCode: 1, path: 1 }, { background: true });
ApiLogsSchema.index({ business: 1, method: 1, path: 1 }, { background: true });
ApiLogsSchema.index({ business: 1, path: 1 }, { background: true });
