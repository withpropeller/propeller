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

interface EnvConfig {
    [prop: string]: string;
}

const EnvSchema = Joi.object({
    NODE_ENV: Joi.string().valid('dev', 'test', 'stg', 'beta', 'prod').optional().default('dev'),
    PORT: Joi.number().optional().default(4000),
    LOG_LEVEL: Joi.string().default('info'),

    APP_ENV: Joi.string().valid('dev', 'test', 'stg', 'beta', 'prod').optional().default('dev'),

    // Mongo DBs
    MONGODB_URL: Joi.string(),

    // Domains
    MAIN_SITE_DOMAIN: Joi.string(),
    APP_DOMAIN: Joi.string(),
    ALLOWED_ORIGINS: Joi.string().optional().default(''),

    // Security
    JWT_SECRET: Joi.string(),
    JWT_SECRET_EXPIRY: Joi.string().optional().default('3h'),
    ENABLE_SWAGGER: Joi.string().optional(),

    // Slack Notification
    SLACK_TOKEN: Joi.string(),
    SLACK_EVENTS_CHANNEL: Joi.string(),

    // AWS Notification
    AWS_REGION: Joi.string(),
    S3_SECRET_ACCESS_KEY: Joi.string(),
    S3_ACCESS_KEY_ID: Joi.string(),
    S3_DOCUMENT_STORE_BUCKET: Joi.string(),

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
        return this.envConfig.APP_DOMAIN;
    }

    /**
     * Comma-separated list of origins permitted by CORS. An entry of `*`
     * disables the allowlist and reflects any origin. Empty string means
     * no cross-origin requests are accepted.
     */
    get ALLOWED_ORIGINS(): string[] {
        return (this.envConfig.ALLOWED_ORIGINS ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
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

    get JWT_SECRET(): string {
        return this.envConfig.JWT_SECRET;
    }

    get JWT_SECRET_EXPIRY(): string {
        return this.envConfig.JWT_SECRET_EXPIRY;
    }

    get inProduction(): boolean {
        return this.envConfig.NODE_ENV === 'prod';
    }

    get inCloud(): boolean {
        return ['prod', 'stg', 'beta'].includes(this.envConfig.NODE_ENV);
    }

    get FLO_ADDR(): string {
        return this.envConfig.FLO_ADDR;
    }

    get FLO_NAMESPACE(): string {
        return this.envConfig.APP_ENV;
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

    get MACHINE_KEY(): string {
        return this.envConfig.MACHINE_KEY;
    }

    get API_SERVICE_URL(): string {
        return this.envConfig.API_SERVICE_URL;
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
}
