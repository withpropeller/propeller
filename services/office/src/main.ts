import { ConfigService } from '@config/config.service';
import { AggregateByTenantContextIdStrategy } from '@core/helpers';
import { ResponseTransformInterceptor } from '@core/interceptors/response-transform.interceptor';
import { ParamValidationPipe } from '@core/pipes/param-validation.pipe';
import { ContextIdFactory, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: true,
        bodyParser: true,
        bufferLogs: true,
    });
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));
    app.useLogger(app.get(Logger));
    app.useGlobalPipes(new ParamValidationPipe());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());

    const config = app.get(ConfigService);

    if (config.ENABLE_SWAGGER) {
        const options = new DocumentBuilder()
            .setTitle('Allawee Infrastructure Backend APIs')
            .setDescription('The Allawee Infrastructure APIs description')
            .setVersion('0.0.1')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, options);
        SwaggerModule.setup('', app, document, {
            jsonDocumentUrl: '/openapi.json',
        });
    }

    await app.listen(config.PORT);
}
bootstrap();
