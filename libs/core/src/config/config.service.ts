import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { CustomException } from '../exceptions/custom-exception.js';
import { AppStatus } from '../helpers/enums.js';

interface EnvConfig {
  [prop: string]: string;
}

/**
 * Centralized configuration service with typed getters.
 *
 * Loads from dotenv files in dev, from process.env in deployed envs.
 *
 * Usage:
 *   constructor(private readonly config: ConfigService) {}
 *   const mongoUrl = config.MONGODB_URI;
 */
@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly envConfig: EnvConfig;

  constructor() {
    const config = ConfigService.getEnvironments();
    this.envConfig = config;
    this.logger.log(`Config loaded for env: ${this.NODE_ENV}`);
  }

  private static deployedInCloud(): boolean {
    return !!process.env.NODE_ENV && ['prod', 'stg', 'beta'].includes(process.env.NODE_ENV);
  }

  private static getEnvironments(): EnvConfig {
    if (ConfigService.deployedInCloud()) {
      return process.env as EnvConfig;
    }

    const envFile = process.env.NODE_ENV
      ? process.env.ENV_FILE_PATH || `env/${process.env.NODE_ENV}.env`
      : 'env/dev.env';

    try {
      if (fs.existsSync(envFile)) {
        return { ...(process.env as EnvConfig), ...dotenv.parse(fs.readFileSync(envFile)) };
      }
    } catch {
      // Fall through to process.env
    }

    return process.env as EnvConfig;
  }

  get(key: string): string {
    return this.envConfig[key] ?? '';
  }

  get NODE_ENV(): string {
    return this.envConfig.NODE_ENV || 'dev';
  }

  get PORT(): number {
    return parseInt(this.envConfig.PORT || '3000', 10);
  }

  get LOG_LEVEL(): string {
    return this.envConfig.LOG_LEVEL || 'info';
  }

  get MONGODB_URI(): string {
    if (this.envConfig.DATABASE_URL) return this.envConfig.DATABASE_URL;
    return this.envConfig.INFRA_MONGODB_URL || 'mongodb://localhost:27017/propeller';
  }

  get ENABLE_SWAGGER(): boolean {
    return /(true|on|1)/gi.test(this.envConfig.ENABLE_SWAGGER || '');
  }

  get inProduction(): boolean {
    return this.NODE_ENV === 'prod';
  }

  // ── Provider helpers ──

  get paykkaEnabled(): boolean {
    return this.envConfig.PROVIDER_PAYKKA_ENABLED === 'true';
  }

  /** Get all provider-relevant config as a flat Record for loadProviders(). */
  get providerConfig(): Record<string, string> {
    const prefixes = ['PROVIDER_', 'PAYKKA_', 'COMPLYADVANTAGE_', 'PAYSTACK_'];
    const config: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.envConfig)) {
      if (prefixes.some((p) => key.startsWith(p)) && typeof value === 'string') {
        config[key] = value;
      }
    }
    return config;
  }
}
