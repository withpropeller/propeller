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
import { AppStatus } from '../core/helpers/enums';
import { AppException } from '@core/exceptions';
import { ExtractURICredentials, RestUriCredentials } from '@config/uri-credential';

interface EnvConfig {
    [prop: string]: string;
}

const EnvSchema = Joi.object({
    NODE_ENV: Joi.string().valid('dev', 'test', 'stg', 'beta', 'prod').optional().default('dev'),
    PORT: Joi.number().optional().default(4000),
    LOG_LEVEL: Joi.string().default('info'),

    // Mongo DBs
    MONGODB_URL: Joi.string(),

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
    JWT_SECRET_EXPIRY: Joi.string().optional().default('3h'),
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
    PREMBLY_URI: Joi.string(),
    FLUTTERWAVE_SECRET_KEY: Joi.string(),
    FLUTTERWAVE_CALLBACK_URL: Joi.string(),
    PAYSTACK_URI: Joi.string(),
    PROVIDUS_THIRD_PARTY_URI: Joi.string(),

    // PayKKa KYB
    PAYKKA_BASE_URL: Joi.string().optional(),
    PAYKKA_API_KEY: Joi.string().optional(),
    PAYKKA_PRIVATE_KEY_PEM: Joi.string().optional(),
    PAYKKA_PUBLIC_KEY_PEM: Joi.string().optional(),
    PAYKKA_KEY_ID: Joi.string().optional(),

    // Flo event bus
    FLO_ADDR: Joi.string().optional().default('localhost:9000'),

    MACHINE_KEY: Joi.string(),
    API_SERVICE_URL: Joi.string(),
    SECURE_SERVICE_URL: Joi.string(),
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
        return this.envConfig.MONGODB_URL + '/core-db';
    }

    get LIVE_MONGODB_URI(): string {
        return this.envConfig.MONGODB_URL + '/live-db';
    }

    get SANDBOX_MONGODB_URI(): string {
        return this.envConfig.MONGODB_URL + '/sandbox-db';
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

    get PREMBLY_URI(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.PREMBLY_URI);
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

    get PAYSTACK_URI(): RestUriCredentials {
        return ExtractURICredentials(this.envConfig.PAYSTACK_URI);
    }

    get MACHINE_KEY(): string {
        return this.envConfig.MACHINE_KEY;
    }

    get API_SERVICE_URL(): string {
        return this.envConfig.API_SERVICE_URL;
    }

    get SECURE_SERVICE_URL(): string {
        return this.envConfig.SECURE_SERVICE_URL;
    }

    get PAYKKA_BASE_URL(): string {
        return this.envConfig.PAYKKA_BASE_URL;
    }

    get PAYKKA_API_KEY(): string {
        return this.envConfig.PAYKKA_API_KEY;
    }

    get PAYKKA_PRIVATE_KEY_PEM(): string {
        return this.envConfig.PAYKKA_PRIVATE_KEY_PEM;
    }

    get PAYKKA_PUBLIC_KEY_PEM(): string {
        return this.envConfig.PAYKKA_PUBLIC_KEY_PEM;
    }

    get PAYKKA_KEY_ID(): string {
        return this.envConfig.PAYKKA_KEY_ID;
    }

    get FLO_ADDR(): string {
        return this.envConfig.FLO_ADDR;
    }
}
