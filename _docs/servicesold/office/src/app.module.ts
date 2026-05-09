import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER } from '@nestjs/core';
import { MongoModule, RFC7807ExceptionFilter, ConfigModule, ConfigService } from '@propeller/core';
import { HealthModule } from './health/health.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.LOG_LEVEL,
          autoLogging: true,
        },
      }),
    }),
    MongoModule,
    HealthModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: RFC7807ExceptionFilter },
  ],
})
export class AppModule {}
