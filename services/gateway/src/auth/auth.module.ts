import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { BusinessModule } from '@api/business/business.module';
import { AuthService } from './auth.service';
import { UsersModule } from '@api/users';
import { OnboardSurveyService } from './onboard/onboard-survey.service';
import { OnboardSurvey, OnboardWizardSchema } from './onboard/onboard-survey.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { MultiFactorAuth } from './multi-factor.auth';
import { TenantDataSource } from '@core/helpers/enums';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { CommonModule } from '@common/common.module';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        UsersModule,
        MongooseModule.forFeature([{ name: OnboardSurvey.name, schema: OnboardWizardSchema }], TenantDataSource.Core),
        HttpModule,
        PassportModule.register({
            defaultStrategy: 'jwt',
        }),
        BusinessModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, MultiFactorAuth, OnboardSurveyService, JwtStrategy],
    exports: [AuthService, MultiFactorAuth],
})
export class AuthModule {}
