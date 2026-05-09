import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../config/config.module.js';
import { ConfigService } from '../config/config.service.js';

/**
 * Global MongoDB module for NestJS apps.
 *
 * Reads DATABASE_URL from ConfigService and connects Mongoose.
 * Import once in AppModule; available everywhere via @InjectModel().
 */
@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.MONGODB_URI,
        dbName: 'propeller',
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
