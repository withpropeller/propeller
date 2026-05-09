import { Module, Global, CacheModule } from '@nestjs/common';
import { EventPublisher } from './events/event.publisher';
import { ConfigModule } from '@config/config.module';
import { RolesModule } from '@api/roles/roles.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@config/config.service';
import { SlackService } from './services/slack.service';
import { HttpModule } from '@nestjs/axios';
import { GRPCModule } from '@common/grpc/grpc.module';
import { ShortenService } from './services/shortener.services';
import { LoggerModule } from 'nestjs-pino';
import { TenantDataSource, PinoLoggerConfig } from './helpers';
import { RedisService } from './services/redis.service';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
    imports: [
        ConfigModule,
        HttpModule,
        MongooseModule.forRootAsync({
            useFactory: (config: ConfigService) => {
                return {
                    uri: config.CORE_MONGODB_URI,
                };
            },
            connectionName: TenantDataSource.Core,
            inject: [ConfigService],
        }),
        MongooseModule.forRootAsync({
            useFactory: (config: ConfigService) => {
                return {
                    uri: config.LIVE_MONGODB_URI,
                };
            },
            connectionName: TenantDataSource.Live,
            inject: [ConfigService],
        }),
        MongooseModule.forRootAsync({
            useFactory: (config: ConfigService) => {
                return {
                    uri: config.SANDBOX_MONGODB_URI,
                };
            },
            connectionName: TenantDataSource.Sandbox,
            inject: [ConfigService],
        }),
        MongooseModule.forRootAsync({
            useFactory: (config: ConfigService) => {
                return {
                    uri: config.OFFICE_MONGODB_URI,
                };
            },
            connectionName: TenantDataSource.Office,
            inject: [ConfigService],
        }),
        CacheModule.register(),
        JwtModule.registerAsync({
            useFactory: (config: ConfigService) => ({
                secret: config.JWT_SECRET,
                signOptions: { expiresIn: config.JWT_SECRET_EXPIRY },
            }),
            inject: [ConfigService],
        }),
        LoggerModule.forRootAsync({
            providers: [ConfigService],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return {
                    pinoHttp: PinoLoggerConfig(config),
                };
            },
        }),
        RolesModule,
        GRPCModule,
    ],
    providers: [RedisService, EventPublisher, ShortenService, SlackService],
    exports: [
        RedisService,
        JwtModule,
        ConfigModule,
        EventPublisher,
        RolesModule,
        ShortenService,
        ConfigModule,
        CacheModule,
        GRPCModule,
        HttpModule,
    ],
})
export class CoreModule {}
