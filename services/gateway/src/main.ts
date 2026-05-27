import { ConfigService } from '@config/config.service';
import { AggregateByTenantContextIdStrategy } from '@core/helpers';
import { ResponseTransformInterceptor } from '@core/interceptors/response-transform.interceptor';
import { ParamValidationPipe } from '@core/pipes/param-validation.pipe';
import { ContextIdFactory, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: true,
        bufferLogs: false,
    });
    app.useLogger(app.get(Logger));
    app.useGlobalPipes(new ParamValidationPipe());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());

    const config = app.get(ConfigService);

    const allowedOrigins = config.ALLOWED_ORIGINS;
    const allowAny = allowedOrigins.includes('*');
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowAny || allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error(`Origin ${origin} not allowed by CORS`), false);
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        // Omitting allowedHeaders makes the cors middleware reflect whatever
        // the browser requests via Access-Control-Request-Headers, so custom
        // headers like x-dashboard-mode or future ones don't need an allowlist
        // update each time.
        exposedHeaders: ['Set-Cookie'],
        maxAge: 86400,
    });

    if (config.ENABLE_SWAGGER) {
        const options = new DocumentBuilder()
            .setTitle('Allawee Infrastructure Backend APIs')
            .setDescription('The Allawee Infrastructure APIs description')
            .setVersion('0.0.1')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, options);
        SwaggerModule.setup('', app, document);
    }

    app.enableShutdownHooks();
    await app.listen(config.PORT);
}

bootstrap().catch((err: unknown) => {
    console.error('Gateway failed to start:', err);
    process.exit(1);
});
