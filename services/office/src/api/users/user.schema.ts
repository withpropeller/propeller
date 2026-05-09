import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { AccountStatus, MessagingChannel, ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Exclude, Type } from 'class-transformer';
import { Business } from '@api/business/business.schema';
import { TwoFAChannels } from '@auth/auth.enums';

export enum DashboardMode {
    Live = 'live',
    Sandbox = 'sandbox',
}

export class StateToken {
    // Set after the email verification completes
    @Prop()
    @Exclude()
    code: string;

    // When the user registered / requested email change
    @Prop({ type: Date })
    @Exclude()
    requestedAt: Date;

    // Time to live in seconds
    @Prop()
    @Exclude()
    ttl: number;
}

export class TwoFactorSettingsOptions {
    @Prop()
    phone: string;

    @Prop()
    email?: string;

    @Prop({ type: String, enum: Utils.enumToArray(MessagingChannel) })
    messagingChannel: MessagingChannel;
}

@Schema()
export class MultiFactorSettings {
    // Set user  verification completes
    @Prop({ sparse: true, unique: true })
    @Exclude()
    secret: string;

    @Prop({ type: String, enum: Utils.enumToArray(TwoFAChannels) })
    channel: TwoFAChannels;

    @Prop()
    @Exclude()
    recoveryKeyHash?: string;

    @Prop({ type: TwoFactorSettingsOptions, _id: false })
    options?: TwoFactorSettingsOptions;

    @Prop({ default: false })
    enabled?: boolean;

    @Prop({ default: false })
    default?: boolean;
}

const MultiFactorSettingsSchema = SchemaFactory.createForClass(MultiFactorSettings);

export class GenericServiceIntegrations {
    @Prop({ required: true })
    id: string;
}

@Schema()
export class ServiceIntegrations {
    @Prop({ type: GenericServiceIntegrations, _id: false })
    onesignal: GenericServiceIntegrations;
}
const ServiceIntegrationsSchema = SchemaFactory.createForClass(ServiceIntegrations);

@Schema()
export class UserPreferences {
    @Prop({
        type: String,
        enum: Utils.enumToArray(DashboardMode),
        default: DashboardMode.Sandbox,
    })
    dashboardMode: DashboardMode;
}
const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz', 'roles:rol'],
        pick: '-passwordHash -multiFactors -stateToken',
        tag: ModelIdTag.User,
    }),
)
export class User {
    // User's firstName, settable by the user
    @Prop({ length: 50 })
    firstName: string;

    // User's lastName, settable by the user
    @Prop({ length: 50 })
    lastName: string;

    // Set after the email verification completes
    @Prop({ length: 50, sparse: true, unique: true, required: true })
    email: string;

    @Prop({ sparse: true, unique: true })
    phone: string;

    @Prop({ default: false })
    emailConfirmed: boolean;

    // A hashed password
    @Prop()
    @Exclude()
    passwordHash: string;

    // Account status of the user - this gives more context to status of a user
    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountStatus),
        default: AccountStatus.PENDING,
    })
    status: AccountStatus;

    // Role Ids - Array of ids representing roles a user has
    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Role' }] })
    roles: any[];

    // Role Ids - Array of ids representing roles a user has
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: Business;

    @Prop({ type: StateToken, _id: false })
    @Type(() => StateToken)
    @Exclude()
    stateToken: StateToken;

    // Two factor settings for user
    @Prop({
        type: [
            {
                type: MultiFactorSettingsSchema,
                _id: false,
                default: { enabled: false },
            },
        ],
    })
    @Type(() => MultiFactorSettings)
    @Exclude()
    multiFactors: MultiFactorSettings[];

    @Prop({ type: ServiceIntegrationsSchema, _id: false })
    @Type(() => ServiceIntegrations)
    @Exclude()
    integration: ServiceIntegrations;

    @Prop({
        type: UserPreferencesSchema,
        _id: false,
        default: { dashboardMode: DashboardMode.Sandbox },
    })
    @Type(() => UserPreferences)
    preferences: UserPreferences;

    multiFactorEnabled: boolean;
    fullName: string;
    identityConfirmed: boolean;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('fullName').get(function (this: HydratedDocument<User>) {
    return this.firstName && this.lastName ? `${this.firstName} ${this.lastName}` : undefined;
});

UserSchema.virtual('multiFactorEnabled').get(function (this: HydratedDocument<User>) {
    return this.multiFactors ? !!this.multiFactors.find((v) => v.enabled === true) : undefined;
});

export { UserSchema };
