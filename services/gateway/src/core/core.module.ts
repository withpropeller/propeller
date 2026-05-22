import { Module, Global, CacheModule } from '@nestjs/common';
import { ConfigModule } from '@config/config.module';
import { RolesModule } from '@api/roles/roles.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@config/config.service';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { TenantDataSource, PinoLoggerConfig } from './helpers';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
    imports: [
        EventEmitterModule.forRoot(),
        ConfigModule,
        HttpModule,
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                return {
                    uri: config.CORE_MONGODB_URI,
                    serverSelectionTimeoutMS: 60_000,
                };
            },
            connectionName: TenantDataSource.Core,
            inject: [ConfigService],
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                return {
                    uri: config.LIVE_MONGODB_URI,
                    serverSelectionTimeoutMS: 60_000,
                };
            },
            connectionName: TenantDataSource.Live,
            inject: [ConfigService],
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                return {
                    uri: config.SANDBOX_MONGODB_URI,
                    serverSelectionTimeoutMS: 60_000,
                };
            },
            connectionName: TenantDataSource.Sandbox,
            inject: [ConfigService],
        }),
        CacheModule.register({ isGlobal: true }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                secret: config.JWT_SECRET,
                signOptions: { expiresIn: config.JWT_SECRET_EXPIRY },
            }),
            inject: [ConfigService],
        }),
        LoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return {
                    pinoHttp: PinoLoggerConfig(config),
                };
            },
        }),
        RolesModule,
    ],
    providers: [],
    exports: [JwtModule, HttpModule],
})
export class CoreModule {}
