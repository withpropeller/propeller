import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { enumPropRequired, ModelIdTag, ModelSchemaOptions } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { SecretKey } from '@api/secret-keys/secret-key.schema';
import { APIRequestStatus } from './api-log.enums';
import { parseQueryBoolean } from '@common/api-paging/utils';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export enum AuditSourceType {
    Api = 'api',
    Dashboard = 'dashboard',
}

@Schema()
export class APIRequestAttempt {
    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Response body from the attempt', type: Object })
    responseBody: any;

    @Prop({ required: true })
    @ApiProperty({ description: 'HTTP status code returned', type: Number })
    statusCode: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Request latency in milliseconds', type: Number })
    latency: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Timestamp of the attempt', type: Date })
    createdAt: Date;
}
export const APIRequestAttemptSchema = SchemaFactory.createForClass(APIRequestAttempt);

@Schema()
export class AuditSource {
    @Prop({ required: true })
    @ApiProperty({ description: 'Client IP address' })
    ipAddress: string;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Parsed client/browser info', type: Object })
    client?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Parsed OS info', type: Object })
    os?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Parsed device info', type: Object })
    device?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Bot detection info', type: Object })
    bot?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Geolocation info', type: Object })
    location?: any;
}
export const AuditSourceSchema = SchemaFactory.createForClass(AuditSource);

@Schema(
    ModelSchemaOptions({
        objectIds: ['secretKey:sk', 'business:bz', 'user:usr', 'events:ev'],
        tag: ModelIdTag.Request,
    }),
)
export class ApiRequest {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    @ApiPropertyOptional({ description: 'Business ID', type: String })
    business: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SecretKey' })
    @ApiPropertyOptional({ description: 'Secret key ID used for the request', type: String })
    secretKey: SecretKey;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    @ApiPropertyOptional({ description: 'Initiating user ID', type: String })
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
    @ApiPropertyOptional({ description: 'Query parameters', type: Object })
    query: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Request body payload', type: Object })
    requestBody: any;

    @Prop({ type: [{ type: APIRequestAttemptSchema, _id: false }] })
    @ApiProperty({ description: 'List of request attempts', type: [APIRequestAttempt] })
    attempts: APIRequestAttempt[];

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }],
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Related event IDs', type: [String] })
    events?: any[];

    @Prop({ required: true })
    @ApiProperty({ description: 'API version used for the request' })
    apiVersion: string;

    @Prop({ type: AuditSourceSchema, _id: false })
    @ApiPropertyOptional({ description: 'Request source metadata', type: AuditSource })
    source?: AuditSource;
}

export const ApiLogSchema = SchemaFactory.createForClass(ApiRequest);
export const ApiHydratedApiRequest = ApiHydrated(ApiRequest);

ApiLogSchema.virtual('sourceType').get(function (this: ApiRequest) {
    return this.secretKey ? AuditSourceType.Api : AuditSourceType.Dashboard;
});

ApiLogSchema.virtual('dryRun').get(function (this: ApiRequest) {
    return parseQueryBoolean(this.query?.dryRun);
});

ApiLogSchema.virtual('responseBody').get(function (this: ApiRequest) {
    const lastAttempt = this.attempts?.[this.attempts.length - 1];
    return lastAttempt?.responseBody;
});

ApiLogSchema.virtual('statusCode').get(function (this: ApiRequest) {
    const lastAttempt = this.attempts?.[this.attempts.length - 1];
    return lastAttempt?.statusCode;
});

ApiLogSchema.virtual('latency').get(function (this: ApiRequest) {
    const lastAttempt = this.attempts?.[this.attempts.length - 1];
    return lastAttempt?.latency;
});

ApiLogSchema.virtual('secureRoute').get(function (this: ApiRequest) {
    const secureRoutesRegex = [
        new RegExp('(cards/[a-zA-Z0-9.]+/activate)$'),
        new RegExp('(cards/[a-zA-Z0-9.]+/secret)$'),
        new RegExp('(cards/[a-zA-Z0-9.]+/reset-pin)$'),
        new RegExp('(cards/link)$'),
    ];
    return secureRoutesRegex.some((regex) => regex.test(this.path));
});
