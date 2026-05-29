/*
 * @license
 * Copyright (c) 2018. The Wevied Company.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Joi from 'joi';
import { Injectable } from '@nestjs/common';
import { AppStatus, TenantDataSource } from '../core/helpers/enums';
import { AppException } from '@core/exceptions';
import { Utils } from '@core/helpers';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { ExtractURICredentials, RestUriCredentials } from './uri-credential';

interface EnvConfig {
    [prop: string]: string;
}

const EnvSchema = Joi.object({
    NODE_ENV: Joi.string().valid('dev', 'test', 'stg', 'beta', 'prod').optional().default('dev'),
    PORT: Joi.number().optional().default(8000),
    LOG_LEVEL: Joi.string().default('info'),

    // DB
    MONGODB_URL: Joi.string(),

    // Messaging
    FLO_ADDR: Joi.string().default('localhost:9000'),

    // Security
    ENABLE_SWAGGER: Joi.string().optional(),

    // Internal service-to-service auth (gateway/office → api-internal).
    // INFRA_SIGNING_KEY verifies signed infra tokens; the *_PREVIOUS slot lets a
    // new key be rolled out while the old one is still accepted (zero-downtime
    // rotation). API_ALLOW_MACHINE_KEY is the network-split gate: it MUST stay
    // false on the public `api` deployment and be set true only on `api-internal`.
    INFRA_SIGNING_KEY: Joi.string().optional().default(''),
    INFRA_SIGNING_KEY_PREVIOUS: Joi.string().optional().default(''),
    API_ALLOW_MACHINE_KEY: Joi.boolean().optional().default(false),

    SLACK_TOKEN: Joi.string(),

    AWS_REGION: Joi.string(),
    S3_ACCESS_KEY_ID: Joi.string(),
    S3_SECRET_ACCESS_KEY: Joi.string(),
    S3_DOCUMENT_STORE_BUCKET: Joi.string(),
});

@Injectable()
export class ConfigService {
    private readonly envConfig: EnvConfig;

    constructor() {
        const config = ConfigService.getEnvironments();
        this.envConfig = ConfigService.validateInput(config);
    }

    private static deployedInCloud() {
        return process.env.NODE_ENV && ['prod', 'stg', 'beta'].includes(process.env.NODE_ENV);
    }

    private static getEnvironments() {
        if (this.deployedInCloud()) {
            return process.env;
        }

        const envFile = process.env.NODE_ENV
            ? process.env.ENV_FILE_PATH || `env/${process.env.NODE_ENV}.env`
            : 'env/dev.env';

        return dotenv.parse(fs.readFileSync(envFile));
    }

    private static validateInput(envConfig: EnvConfig): EnvConfig {
        const { error, value: validatedEnvConfig } = EnvSchema.validate(envConfig, {
            allowUnknown: true,
            presence: 'required',
            stripUnknown: true,
        });

        if (error) {
            throw new AppException(error, `Config validation error: ${error.message}`, AppStatus.ConfigurationError);
        }
        return validatedEnvConfig;
    }

    get(key: string): string {
        return this.envConfig[key];
    }

    get APP_ENV(): string {
        return this.envConfig.NODE_ENV == 'dev' ? 'stg' : this.envConfig.NODE_ENV;
    }

    get PORT(): number {
        return parseInt(this.envConfig.PORT, 10);
    }

    get LOG_LEVEL(): string {
        return this.envConfig.LOG_LEVEL;
    }

    get MONGODB_URL(): string {
        return this.envConfig.MONGODB_URL;
    }

    get CORE_MONGODB_URI(): string {
        return this.envConfig.MONGODB_URL + '/core-db';
    }

    get LIVE_MONGODB_URI(): string {
        return this.envConfig.MONGODB_URL + '/live-db';
    }

    get SANDBOX_MONGODB_URI(): string {
        return this.envConfig.MONGODB_URL + '/sandbox-db';
    }

    get RABBIT_MQ_URL(): string {
        return this.envConfig.RABBIT_MQ_URL;
    }

    get FLO_ADDR(): string {
        return this.envConfig.FLO_ADDR;
    }

    get FLO_NAMESPACE(): string {
        return this.envConfig.NODE_ENV;
    }

    /**
     * Whether this deployment accepts internal machine-key (infra-token) auth.
     * Fail-closed: only `api-internal` (network-isolated, no public expose) sets
     * this true. The public `api` rejects all machine-key auth.
     */
    get API_ALLOW_MACHINE_KEY(): boolean {
        return `${this.envConfig.API_ALLOW_MACHINE_KEY}` === 'true';
    }

    /** Signing secrets accepted for infra tokens — current first, then previous (rotation). */
    get INFRA_SIGNING_KEYS(): string[] {
        return [this.envConfig.INFRA_SIGNING_KEY, this.envConfig.INFRA_SIGNING_KEY_PREVIOUS].filter(Boolean);
    }

    get inProduction(): boolean {
        return this.envConfig.NODE_ENV === 'prod';
    }

    get inCloud(): boolean {
        return ['prod', 'stg', 'beta'].includes(this.envConfig.NODE_ENV);
    }

    get ENABLE_SWAGGER() {
        return /(true|on|1)/gi.test(this.envConfig.ENABLE_SWAGGER);
    }

    CONVOY_SECRET_KEY(payload: TenantRequestPayload): string {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? this.envConfig.CONVOY_SECRET_KEY_LIVE
            : this.envConfig.CONVOY_SECRET_KEY_SANDBOX;
    }

    get ENCRYPTION_PASSPHRASE(): string {
        return this.envConfig.INFRA_ENCRYPTION_PASSPHRASE;
    }

    get ISV_SERVICE_GRPC_URL(): string {
        return this.envConfig.ISV_SERVICE_GRPC_URL;
    }

    get CARD_AUTH_SANDBOX_URL(): string {
        return this.envConfig.CARD_AUTH_SANDBOX_URL;
    }

    get INFRA_WEBHOOK_SANDBOX_URL(): string {
        return this.envConfig.INFRA_WEBHOOK_SANDBOX_URL;
    }

    get WEBHOOK_SERVICE_SANDBOX_URL(): string {
        return this.envConfig.WEBHOOK_SERVICE_SANDBOX_URL;
    }

    get PROVIDUS_SETTLEMENT_URI(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.PROVIDUS_SETTLEMENT_URI);
    }

    get INTERSWITCH_SECRET_KEY(): string {
        return this.envConfig.INTERSWITCH_SECRET_KEY;
    }

    get CAGE_SERVICE_URL(): string {
        return this.envConfig.CAGE_SERVICE_URL;
    }

    get EVERVAULT_API_KEY(): string {
        return this.envConfig.EVERVAULT_API_KEY;
    }

    get EVERVAULT_APP_ID(): string {
        return this.envConfig.EVERVAULT_APP_ID;
    }

    get SCPLITE_CLIENT_ID(): string {
        return this.envConfig.SCPLITE_CLIENT_ID;
    }

    get SCPLITE_CLIENT_SECRET(): string {
        return this.envConfig.SCPLITE_CLIENT_SECRET;
    }

    get PROVIDUS_THIRD_PARTY_URI(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.PROVIDUS_THIRD_PARTY_URI);
    }

    MAPLERAD_URI(payload: TenantRequestPayload): RestUriCredentials {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? ExtractURICredentials(this.envConfig.MAPLERAD_URI_LIVE)
            : ExtractURICredentials(this.envConfig.MAPLERAD_URI_SANDBOX);
    }

    PROVIPAY_URI(payload: TenantRequestPayload): RestUriCredentials {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? ExtractURICredentials(this.envConfig.PROVIPAY_URI_LIVE)
            : ExtractURICredentials(this.envConfig.PROVIPAY_URI_SANDBOX);
    }

    PAVILION_URI(payload: TenantRequestPayload): RestUriCredentials {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? ExtractURICredentials(this.envConfig.PAVILION_URI_LIVE)
            : ExtractURICredentials(this.envConfig.PAVILION_URI_SANDBOX);
    }

    get PAVILION_BASE_URL_LIVE(): string {
        return this.envConfig.PAVILION_BASE_URL_LIVE;
    }

    get PAVILION_BASE_URL_SANDBOX(): string {
        return this.envConfig.PAVILION_BASE_URL_SANDBOX;
    }

    get PAVILION_URI_SANDBOX(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.PAVILION_URI_SANDBOX);
    }

    get APP_PRI_KEY_SANDBOX(): string {
        return this.envConfig.APP_PRI_KEY_SANDBOX;
    }

    get APP_PUB_KEY_SANDBOX(): string {
        return this.envConfig.APP_PUB_KEY_SANDBOX;
    }

    PAVILION_PUB_KEY(payload: TenantRequestPayload): string {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? this.envConfig.PAVILION_PUB_KEY_LIVE
            : this.envConfig.PAVILION_PUB_KEY_SANDBOX;
    }

    PAYSTACK_URI(payload?: TenantRequestPayload) {
        return Utils.safeStringEqual(payload?.tenantId, TenantDataSource.Live)
            ? ExtractURICredentials(this.envConfig.PAYSTACK_URI_LIVE)
            : ExtractURICredentials(this.envConfig.PAYSTACK_URI_SANDBOX);
    }

    get MAPLERAD_SIGNING_KEY_SANDBOX(): string {
        return this.envConfig.MAPLERAD_SIGNING_KEY_SANDBOX;
    }

    get INTERSWITCH_SAFETOKEN_URI(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.INTERSWITCH_SAFETOKEN_URI);
    }

    get SLACK_TOKEN(): string {
        return this.envConfig.SLACK_TOKEN;
    }

    get SLACK_EVENTS_CHANNEL(): string {
        return 'infra-events-' + this.APP_ENV;
    }

    get BROWSERLESS_WS_URL(): string {
        return this.envConfig.BROWSERLESS_WS_URL;
    }

    get AWS_REGION() {
        return this.envConfig.AWS_REGION;
    }

    get S3_ACCESS_KEY_ID() {
        return this.envConfig.S3_ACCESS_KEY_ID;
    }

    get S3_SECRET_ACCESS_KEY() {
        return this.envConfig.S3_SECRET_ACCESS_KEY;
    }

    get S3_DOCUMENT_STORE_BUCKET() {
        return this.envConfig.S3_DOCUMENT_STORE_BUCKET;
    }

    get FLUTTERWAVE_URI() {
        return ExtractURICredentials(this.envConfig.FLUTTERWAVE_URI);
    }

    get PAYSTACK_URI_LIVE() {
        return ExtractURICredentials(this.envConfig.PAYSTACK_URI_LIVE);
    }

    get PROVIDUS_SETTLEMENT_ACCOUNT_NUMBER() {
        return this.envConfig.PROVIDUS_SETTLEMENT_ACCOUNT_NUMBER;
    }

    get SECRET_MONTH_PATH() {
        return this.inCloud ? '/etc/secrets/' : './env/';
    }

    APP_PRIVATE_KEY(payload: TenantRequestPayload) {
        return `${this.SECRET_MONTH_PATH}/${payload?.tenantId}-private.pem`;
    }

    APP_PUBLIC_KEY(payload: TenantRequestPayload) {
        return `${this.SECRET_MONTH_PATH}/${payload?.tenantId}-public.pem`;
    }

    PAVILION_PUBLIC_KEY(payload: TenantRequestPayload) {
        return `${this.SECRET_MONTH_PATH}/${payload?.tenantId}-pavilion-public.pem`;
    }
}
