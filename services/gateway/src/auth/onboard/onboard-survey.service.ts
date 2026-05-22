import { AuthService } from '@auth/auth.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { OnboardSurvey } from './onboard-survey.schema';
import { Repository } from '@core/abstracts/repository';
import { OnboardSurveyDto } from './onboard-survey.dto';
import { SCryptCryptoFactory } from '@core/crypto';
import { AuthException } from '@auth/auth.exception';
import { TenantDataSource } from '@core/helpers/enums';
import { isSelfServeMerchantCountry } from './onboard.constants';

@Injectable()
export class OnboardSurveyService extends Repository<OnboardSurvey> {
    constructor(
        @InjectModel(OnboardSurvey.name, TenantDataSource.Core) model: Model<HydratedDocument<OnboardSurvey>>,
        @Inject(forwardRef(() => AuthService))
        private authService: AuthService,
    ) {
        super(model);
    }

    async saveOnboard(body: OnboardSurveyDto) {
        const onboard = await this.findOne({ email: body.email }, true);
        if (!onboard) {
            const { password, ...entity } = body;
            const passwordHash = await SCryptCryptoFactory.hash(password);

            return this.createAndSave({ ...entity, passwordHash });
        }

        return this.updateOnboard(onboard.id, body);
    }

    async updateOnboard(publicId: string, body: OnboardSurveyDto) {
        return this.findOneAndUpdate({ _id: publicId }, body);
    }

    async onboardBusiness(onboard: OnboardSurvey) {
        // make decision on onboard wizard
        await this.ensureOnboardCriteriaMet(onboard);

        return this.authService.signup(onboard);
    }

    async ensureOnboardCriteriaMet(onboard: OnboardSurvey) {
        if (!onboard.isIncorporated || !isSelfServeMerchantCountry(onboard.countryCode)) {
            throw AuthException.ONBOARD_CRITERIA_NOT_MET;
        }
        return onboard;
    }
}
