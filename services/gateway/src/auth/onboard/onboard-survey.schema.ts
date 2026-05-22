import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelSchemaOptions } from '@core/helpers';
import { Exclude } from 'class-transformer';

@Schema(ModelSchemaOptions())
export class OnboardSurvey {
    // User's firstName, settable by the user
    @Prop({ length: 50 })
    firstName: string;

    // User's lastName, settable by the user
    @Prop({ length: 50 })
    lastName: string;

    // Set after the email verification completes
    @Prop({ length: 50, unique: true, required: true })
    email: string;

    @Prop({ required: true })
    phone: string;

    @Prop({})
    @Exclude()
    readonly passwordHash: string;

    @Prop()
    businessName: string;

    @Prop()
    readonly businessWebsite: string;

    @Prop()
    isIncorporated: boolean;

    @Prop({ default: 'CN' })
    countryCode: string;
}

export const OnboardWizardSchema = SchemaFactory.createForClass(OnboardSurvey);
