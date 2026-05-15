import { ContextIdFactory, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ParamValidationPipe } from '@core/pipes/param-validation.pipe';
import { ResponseTransformInterceptor } from '@core/interceptors/response-transform.interceptor';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@config/config.service';
import { INestApplication, VersioningType } from '@nestjs/common';
import { AggregateByTenantContextIdStrategy } from '@core/helpers/tenant-context-id.strategy';
import { ApiVersion, LocalRequestProperty } from '@core/helpers/enums';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';


export function buildOpenApiDocument(app: INestApplication) {
    const options = new DocumentBuilder()
        .setTitle('Propeller APIs')
        .setDescription('Financial Infrastructure for the China–Africa corridor')
        .setVersion(ApiVersion.Current)
        .addBearerAuth()
        .build();
    return SwaggerModule.createDocument(app, options);
}


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
        const document = buildOpenApiDocument(app);
        SwaggerModule.setup('', app, document, {
            jsonDocumentUrl: '/openapi.json',
        });
    }

    await app.listen(config.PORT);
}

bootstrap();
