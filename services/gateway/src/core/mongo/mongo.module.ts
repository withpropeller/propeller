import { Module } from '@nestjs/common';
import { ConfigService } from '@config/config.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoDataSource } from './mongo.enums';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: (config: ConfigService) => {
                return {
                    uri: config.MONGODB_URI,
                    dbName: MongoDataSource.Core,
                };
            },
            inject: [ConfigService],
        }),
    ],
    providers: [],
    exports: [MongooseModule],
})
export class MongoModule {}
