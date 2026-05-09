import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@config/config.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@config/config.service';
import { TenantDataSource } from './helpers/enums';
import { LoggerModule } from 'nestjs-pino';
import { PinoLoggerConfig } from './helpers';
import { FloService } from './services/flo.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
    imports: [
        ConfigModule,
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
        LoggerModule.forRootAsync({
            providers: [ConfigService],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return {
                    pinoHttp: PinoLoggerConfig(config),
                };
            },
        }),
        EventEmitterModule.forRoot(),
    ],
    providers: [FloService],
    exports: [FloService, ConfigModule],
})
export class CoreModule {}
