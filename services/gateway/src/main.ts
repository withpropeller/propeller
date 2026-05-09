import { ConfigService } from '@config/config.service';
import { AggregateByTenantContextIdStrategy } from '@core/helpers';
import { ResponseTransformInterceptor } from '@core/interceptors/response-transform.interceptor';
import { ParamValidationPipe } from '@core/pipes/param-validation.pipe';
import { ContextIdFactory, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule as GraphQLAppModule } from './app.graphql.module';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: true,
        bodyParser: true,
        bufferLogs: true,
    });
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
        SwaggerModule.setup('', app, document);
    }

    await app.listen(config.PORT);
}
bootstrap();

async function bootstrapGraphQL() {
    const app = await NestFactory.create(GraphQLAppModule, {
      // cors: true,
    //    bodyParser: true,
    //    bufferLogs: true,
    });
   // app.useLogger(app.get(Logger));
   // app.useGlobalPipes(new ParamValidationPipe());
   // app.useGlobalInterceptors(new ResponseTransformInterceptor());
   // ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());

 //   const config = app.get(ConfigService);

    await app.listen(4000);
}

//bootstrapGraphQL()