import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { OnboardSurvey } from './onboard-survey.schema';
import { Repository } from '@core/abstracts/repository';
import { TenantDataSource } from '@core/helpers/enums';

@Injectable()
export class OnboardSurveyService extends Repository<OnboardSurvey> {
    constructor(
        @InjectModel(OnboardSurvey.name, TenantDataSource.Core)
        model: Model<HydratedDocument<OnboardSurvey>>,
    ) {
        super(model);
    }
}
