import { ApiModule } from "@api/api.module";
import { BusinessModule } from "@api/business/business.module";
import { CustomersModule } from "@api/customers/customers.module";
import { UsersModule } from "@api/users";
import { AuthModule } from "@auth/auth.module";
import { JwtAuthGuard } from "@auth/guards";
import { upperDirectiveTransformer } from "@common/directives/upper-case.directive";
import { CoreModule } from "@core/core.module";
import { CustomExceptionFilter } from "@core/exceptions/custom-exception.filter";
import { HttpExceptionFilter } from "@core/exceptions/http-exception.filter";
import { ApolloDriverConfig, ApolloDriver } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { APP_GUARD, APP_FILTER } from "@nestjs/core";
import { GraphQLModule } from "@nestjs/graphql";
import { ThrottlerModule } from "@nestjs/throttler";
import { GraphQLDirective, DirectiveLocation } from "graphql";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    CoreModule,
    ApiModule,
    AuthModule,
    UsersModule,
    BusinessModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    HealthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      include: [CustomersModule],
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      transformSchema: schema => upperDirectiveTransformer(schema, 'upper'),
     // installSubscriptionHandlers: true,
      buildSchemaOptions: {
        directives: [
          new GraphQLDirective({
            name: 'upper',
            locations: [DirectiveLocation.FIELD_DEFINITION],
          }),
        ],
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },/*
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: CustomExceptionFilter,
    },*/
  ],
})
export class AppModule { }