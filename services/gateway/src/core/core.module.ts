import { Module, Global, CacheModule } from '@nestjs/common';
import { ConfigModule } from '@config/config.module';
import { RolesModule } from '@api/roles/roles.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@config/config.service';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { TenantDataSource, PinoLoggerConfig } from './helpers';
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
    ],
    providers: [],
})
export class CoreModule {}
