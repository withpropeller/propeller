import { join } from 'path';
import { ConfigService } from '@config/config.service';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GRPCService, ISV_SERVICE_GRPC_TOKEN } from './grpc.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: ISV_SERVICE_GRPC_TOKEN,
                inject: [ConfigService],
                useFactory: (config: ConfigService) => {
                    return {
                        transport: Transport.GRPC,
                        options: {
                            package: 'isv',
                            url: config.ISV_SERVICE_GRPC_URL,
                            protoPath: join(__dirname, '../../protos/isv.proto'),
                        },
                    };
                },
            },
        ]),
    ],
    providers: [GRPCService],
    exports: [GRPCService],
})
export class GRPCModule {}
