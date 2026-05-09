import { ContextIdFactory, NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ParamValidationPipe } from '@core/pipes/param-validation.pipe';
import { ResponseTransformInterceptor } from '@core/interceptors/response-transform.interceptor';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@config/config.service';
import { VersioningType } from '@nestjs/common';
import { AggregateByTenantContextIdStrategy } from '@core/helpers/tenant-context-id.strategy';
import { ApiVersion, LocalRequestProperty } from '@core/helpers/enums';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
    const server = express();
    server.disable('x-powered-by');

    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
        cors: true,
        bodyParser: true,
        bufferLogs: true,
    });

    //const appf = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    app.useLogger(app.get(Logger));
    app.useGlobalPipes(new ParamValidationPipe());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.enableVersioning({
        type: VersioningType.HEADER,
        header: LocalRequestProperty.ApiVersion,
        // defaultVersion: ApiVersions.Current,
    });

    ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());
    const config = app.get(ConfigService);

    if (config.ENABLE_SWAGGER) {
        const options = new DocumentBuilder()
            .setTitle('Allawee APIs')
            .setDescription('Financial Infrastructure')
            .setVersion(ApiVersion.Current)
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, options);
        SwaggerModule.setup('/swagger', app, document);
    }

    await app.listen(config.PORT);
}

bootstrap();
