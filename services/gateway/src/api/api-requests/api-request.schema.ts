import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AppStatus, ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { parseQueryBoolean } from '@common/api-paging/utils';
import { APIRequestStatus } from './api-requests.enums';
import { enumPropRequired } from '@core/mongo/mongo.utils';
import { RESPONSE_REDACTION, REQUEST_REDACTION } from './api-requests.utils';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export enum AuditSourceType {
    Api = 'api',
    Dashboard = 'dashboard',
}

export interface ApiRequestsPayload {
    request: any;
    statusCode: number;
    latency: number;
    data: any;
}

@Schema()
export class AuditSource {
    @Prop({ required: true })
    @ApiProperty({ description: 'IP address of the request source' })
    ipAddress: string;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Client information' })
    client?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Operating system information' })
    os?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Device information' })
    device?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Bot detection information' })
    bot?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Geolocation information' })
    location?: any;
}
export const AuditSourceSchema = SchemaFactory.createForClass(AuditSource);

@Schema()
export class APIRequestAttempt {
    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Response body of this attempt' })
    responseBody: any;

    @Prop({ required: true })
    @ApiProperty({ description: 'HTTP status code', type: Number })
    statusCode: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Request latency in milliseconds', type: Number })
    latency: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Attempt timestamp', type: Date })
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
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    @ApiProperty({ description: 'Business ID', type: String })
    business: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SecretKey' })
    @ApiPropertyOptional({ description: 'Secret key ID', type: String })
    secretKey: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    @ApiPropertyOptional({ description: 'Initiator user ID', type: String })
    initiator: any;

    @Prop(enumPropRequired(APIRequestStatus))
    @ApiProperty({ description: 'Request status', enum: APIRequestStatus })
    status: APIRequestStatus;

    @Prop({ required: true })
    @ApiProperty({ description: 'Request path' })
    path: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'HTTP method' })
    method: string;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Query parameters' })
    query: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Request body' })
    requestBody: any;

    @Prop({ type: [{ type: APIRequestAttemptSchema, _id: false }] })
    @ApiPropertyOptional({ description: 'Request attempts', type: [APIRequestAttempt] })
    attempts: APIRequestAttempt[];

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }],
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Associated event IDs', type: [String] })
    events?: any[];

    @Prop({ required: true })
    @ApiProperty({ description: 'API version' })
    apiVersion: string;

    @Prop({ type: AuditSourceSchema, _id: false })
    @ApiPropertyOptional({ description: 'Request source information', type: AuditSource })
    source?: AuditSource;

    @Prop({ type: AuditSourceSchema, _id: false })
    @ApiPropertyOptional({ description: 'Proxy source information', type: AuditSource })
    proxySource?: AuditSource;
}

export const ApiRequestsSchema = SchemaFactory.createForClass(ApiRequest);
export const ApiHydratedApiRequest = ApiHydrated(ApiRequest);

ApiRequestsSchema.virtual('sourceType').get(function (this: ApiRequest) {
    return this.secretKey ? AuditSourceType.Api : AuditSourceType.Dashboard;
});

ApiRequestsSchema.virtual('dryRun').get(function (this: ApiRequest) {
    return parseQueryBoolean(this.query?.dryRun);
});

ApiRequestsSchema.virtual('responseBody').get(function (this: ApiRequest) {
    const lastAttempt = this.attempts?.[this.attempts.length - 1];

    if (lastAttempt?.responseBody && lastAttempt?.responseBody.code != AppStatus.BadRequest) {
        return Utils.pickKeys(lastAttempt.responseBody, '-error');
    }
    return lastAttempt?.responseBody;
});

ApiRequestsSchema.virtual('statusCode').get(function (this: ApiRequest) {
    const lastAttempt = this.attempts?.[this.attempts.length - 1];
    return lastAttempt?.statusCode;
});

ApiRequestsSchema.virtual('latency').get(function (this: ApiRequest) {
    const lastAttempt = this.attempts?.[this.attempts.length - 1];
    return lastAttempt?.latency;
});

ApiRequestsSchema.virtual('secureRoute').get(function (this: ApiRequest) {
    const secureRoutesRegex = [
        new RegExp('(cards/[a-zA-Z0-9.]+/activate)$'),
        new RegExp('(cards/[a-zA-Z0-9.]+/secrets)$'),
        new RegExp('(cards/[a-zA-Z0-9.]+/reset-pin)$'),
        new RegExp('(cards/link)$'),
    ];
    return secureRoutesRegex.some((regex) => regex.test(this.path));
});
