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
import { ExtractURICredentials, RestUriCredentials } from '@config/uri-credential';
import { TenantRequestPayload, Utils } from '@core/helpers';

interface EnvConfig {
    [prop: string]: string;
}

const EnvSchema = Joi.object({
    NODE_ENV: Joi.string().valid('dev', 'test', 'stg', 'beta', 'prod').optional().default('dev'),
    PORT: Joi.number().optional().default(4000),
    LOG_LEVEL: Joi.string().default('info'),

    // Mongo DBs
    INFRA_MONGODB_URL: Joi.string(),

    // Domains
    MAIN_SITE_DOMAIN: Joi.string(),
    INFRA_WEB_DOMAIN: Joi.string(),

    // Messaging
    SHORTENER_SERVICE_GRPC_URL: Joi.string(),
    ISV_SERVICE_GRPC_URL: Joi.string(),
    BROWSERLESS_WS_URL: Joi.string(),

    // Redis
    REDIS_URI: Joi.string(),

    // Security
    INFRA_JWT_SECRET: Joi.string(),
    JWT_SECRET_EXPIRY: Joi.string().optional().default('7d'),
    ENABLE_SWAGGER: Joi.string().optional(),
    INFRA_ENCRYPTION_PASSPHRASE: Joi.string(),

    // Slack Notification
    SLACK_TOKEN: Joi.string(),
    SLACK_EVENTS_CHANNEL: Joi.string(),

    // AWS Notification
    AWS_REGION: Joi.string(),
    S3_SECRET_ACCESS_KEY: Joi.string(),
    S3_ACCESS_KEY_ID: Joi.string(),
    S3_DOCUMENT_STORE_BUCKET: Joi.string(),

    //External Integrations
    IDENTITY_PASS_SECRET_KEY: Joi.string(),
    FLUTTERWAVE_SECRET_KEY: Joi.string(),
    FLUTTERWAVE_CALLBACK_URL: Joi.string(),
    PAYSTACK_URI: Joi.string(),
    FLUTTERWAVE_URI: Joi.string(),
    PROVIDUS_THIRD_PARTY_URI: Joi.string(),
    PROVIDUS_SETTLEMENT_URI: Joi.string(),
    PROVIDUS_SETTLEMENT_ACCOUNT_NUMBER: Joi.string(),

    MAPLERAD_URI_LIVE: Joi.string(),

    CAGE_SERVICE_URL: Joi.string(),
    EVERVAULT_API_KEY: Joi.string(),

    SECURE_SERVICE_URL: Joi.string(),
    INTERSWITCH_SECRET_KEY: Joi.string(),

    CARD_AUTH_SANDBOX_URL: Joi.string(),
    CARD_AUTH_LIVE_URL: Joi.string(),

    WEBHOOK_SERVICE_LIVE_URL: Joi.string(),

    PAVILION_URI_SANDBOX: Joi.string(),
    PAVILION_URI_LIVE: Joi.string(),

    APP_PRI_KEY_LIVE: Joi.string(),
    APP_PRI_KEY_SANDBOX: Joi.string(),

    APP_PUB_KEY_LIVE: Joi.string(),
    APP_PUB_KEY_SANDBOX: Joi.string(),

    PAVILION_PUB_KEY_LIVE: Joi.string(),
    PAVILION_PUB_KEY_SANDBOX: Joi.string(),
    PAVILION_BASE_URL_LIVE: Joi.string(),

    PROVIPAY_URI_LIVE: Joi.string(),
    PROVIPAY_URI_SANDBOX: Joi.string(),
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

    get PORT(): number {
        return parseInt(this.envConfig.PORT, 10);
    }

    get LOG_LEVEL(): string {
        return this.envConfig.LOG_LEVEL;
    }

    get MAIN_SITE_DOMAIN(): string {
        return this.envConfig.MAIN_SITE_DOMAIN;
    }

    get APP_DOMAIN(): string {
        return this.envConfig.INFRA_WEB_DOMAIN;
    }

    get MONGODB_URL(): string {
        return this.envConfig.MONGODB_URL;
    }

    get CORE_MONGODB_URI(): string {
        return this.envConfig.INFRA_MONGODB_URL + '/core-db';
    }

    get OFFICE_MONGODB_URI(): string {
        return this.envConfig.INFRA_MONGODB_URL + '/office-db';
    }

    get LIVE_MONGODB_URI(): string {
        return this.envConfig.INFRA_MONGODB_URL + '/live-db';
    }

    get SANDBOX_MONGODB_URI(): string {
        return this.envConfig.INFRA_MONGODB_URL + '/sandbox-db';
    }

    get REDIS_PORT(): string {
        return this.envConfig.REDIS_PORT;
    }

    get REDIS_URI(): string {
        return this.envConfig.REDIS_URI;
    }

    get SHORTENER_SERVICE_GRPC_URL(): string {
        return this.envConfig.SHORTENER_SERVICE_GRPC_URL;
    }

    get ISV_SERVICE_GRPC_URL(): string {
        return this.envConfig.ISV_SERVICE_GRPC_URL;
    }

    get BROWSERLESS_WS_URL(): string {
        return this.envConfig.BROWSERLESS_WS_URL;
    }

    get JWT_SECRET(): string {
        return this.envConfig.INFRA_JWT_SECRET;
    }

    get JWT_SECRET_EXPIRY(): string {
        return this.envConfig.JWT_SECRET_EXPIRY;
    }

    get ENCRYPTION_PASSPHRASE(): string {
        return this.envConfig.INFRA_ENCRYPTION_PASSPHRASE;
    }

    get inProduction(): boolean {
        return this.envConfig.NODE_ENV === 'prod';
    }

    get inCloud(): boolean {
        return ['prod', 'stg', 'beta'].includes(this.envConfig.NODE_ENV);
    }

    get APP_ENVIRONMENT() {
        return this.envConfig.APP_ENVIRONMENT;
    }

    get ENABLE_SWAGGER() {
        return /(true|on|1)/gi.test(this.envConfig.ENABLE_SWAGGER);
    }

    get SLACK_TOKEN(): string {
        return this.envConfig.SLACK_TOKEN;
    }

    get SLACK_EVENTS_CHANNEL(): string {
        return this.envConfig.SLACK_EVENTS_CHANNEL;
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

    get IDENTITY_PASS_SECRET_KEY(): string {
        return this.envConfig.IDENTITY_PASS_SECRET_KEY;
    }

    get FLUTTERWAVE_SECRET_KEY(): string {
        return this.envConfig.FLUTTERWAVE_SECRET_KEY;
    }

    get FLUTTERWAVE_CALLBACK_URL(): string {
        return this.envConfig.FLUTTERWAVE_CALLBACK_URL;
    }

    get PROVIDUS_THIRD_PARTY_URI(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.PROVIDUS_THIRD_PARTY_URI);
    }

    get PROVIDUS_SETTLEMENT_URI(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.PROVIDUS_SETTLEMENT_URI);
    }

    get PROVIDUS_SETTLEMENT_ACCOUNT_NUMBER(): string {
        return this.envConfig.PROVIDUS_SETTLEMENT_ACCOUNT_NUMBER;
    }

    get PAYSTACK_URI(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.PAYSTACK_URI);
    }

    get FLUTTERWAVE_URI() {
        return ExtractURICredentials(this.envConfig.FLUTTERWAVE_URI);
    }

    get INTERSWITCH_SECRET_KEY(): string {
        return this.envConfig.INTERSWITCH_SECRET_KEY;
    }

    get WEBHOOK_SERVICE_LIVE_URL(): string {
        return this.envConfig.WEBHOOK_SERVICE_LIVE_URL;
    }

    CARD_AUTH_URL(payload: TenantRequestPayload): string {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? this.envConfig.CARD_AUTH_LIVE_URL
            : this.envConfig.CARD_AUTH_SANDBOX_URL;
    }

    PAVILION_URI(payload: TenantRequestPayload): RestUriCredentials {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? ExtractURICredentials(this.envConfig.PAVILION_URI_LIVE)
            : ExtractURICredentials(this.envConfig.PAVILION_URI_SANDBOX);
    }

    APP_PRIVATE_KEY(payload: TenantRequestPayload): string {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? this.envConfig.APP_PRI_KEY_LIVE
            : this.envConfig.APP_PRI_KEY_SANDBOX;
    }

    APP_PUB_KEY(payload: TenantRequestPayload): string {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? this.envConfig.APP_PUB_KEY_LIVE
            : this.envConfig.APP_PUB_KEY_SANDBOX;
    }

    PAVILION_PUB_KEY(payload: TenantRequestPayload): string {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? this.envConfig.PAVILION_PUB_KEY_LIVE
            : this.envConfig.PAVILION_PUB_KEY_SANDBOX;
    }

    get PAVILION_BASE_URL_LIVE(): string {
        return this.envConfig.PAVILION_BASE_URL_LIVE;
    }

    PROVIPAY_URI(payload: TenantRequestPayload): RestUriCredentials {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? ExtractURICredentials(this.envConfig.PROVIPAY_URI_LIVE)
            : ExtractURICredentials(this.envConfig.PROVIPAY_URI_SANDBOX);
    }

    get MAPLERAD_URI_LIVE(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.MAPLERAD_URI_LIVE);
    }

    get MAPLERAD_URI_SANDBOX(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.MAPLERAD_URI_SANDBOX);
    }

    MAPLERAD_URI(payload: TenantRequestPayload): RestUriCredentials {
        return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
            ? ExtractURICredentials(this.envConfig.MAPLERAD_URI_LIVE)
            : ExtractURICredentials(this.envConfig.MAPLERAD_URI_SANDBOX);
    }


    get SECURE_SERVICE_URL(): string {
        return this.envConfig.SECURE_SERVICE_URL;
    }

    get CAGE_SERVICE_URL(): string {
        return this.envConfig.CAGE_SERVICE_URL;
    }

    get EVERVAULT_API_KEY(): string {
        return this.envConfig.EVERVAULT_API_KEY;
    }
}
