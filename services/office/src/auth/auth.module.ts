import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OnboardSurveyService } from './onboard/onboard-survey.service';
import { OnboardSurvey, OnboardWizardSchema } from './onboard/onboard-survey.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { MultiFactorAuth } from './multi-factor.auth';
import { TenantDataSource } from '@core/helpers/enums';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { CommonModule } from '@common/common.module';
import { AdminsModule } from '@api/admins/admin.module';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        AdminsModule,
        MongooseModule.forFeature([{ name: OnboardSurvey.name, schema: OnboardWizardSchema }], TenantDataSource.Core),
        HttpModule,
        PassportModule.register({
            defaultStrategy: 'jwt',
        }),
    ],
    providers: [AuthService, OnboardSurveyService, JwtStrategy, MultiFactorAuth],
    controllers: [AuthController],
    exports: [AuthService, MultiFactorAuth],
})
export class AuthModule {}
