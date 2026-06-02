import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { AccountStatus, MessagingChannel, ModelSchemaOptions, Utils } from '@core/helpers';
import { Exclude, Type } from 'class-transformer';
import { Business } from '@api/business/business.schema';
import { TwoFAChannels } from '@auth/auth.enums';
import { ApiHydrated } from '@common/dtos';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DashboardMode {
    Live = 'live',
    Sandbox = 'sandbox',
}

export class StateToken {
    // Set after the email verification completes
    @Prop()
    @Exclude()
    @ApiProperty({ description: 'Email verification code' })
    code: string;

    // When the user registered / requested email change
    @Prop({ type: Date })
    @Exclude()
    @ApiProperty({ description: 'Token requested at', type: Date })
    requestedAt: Date;

    // Time to live in seconds
    @Prop()
    @Exclude()
    @ApiProperty({ description: 'Time to live in seconds', type: Number })
    ttl: number;
}

export class TwoFactorSettingsOptions {
    @Prop()
    @ApiProperty({ description: 'Phone number for 2FA' })
    phone: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Email for 2FA' })
    email?: string;

    @Prop({ type: String, enum: Utils.enumToArray(MessagingChannel) })
    @ApiProperty({ description: 'Messaging channel for 2FA', enum: MessagingChannel })
    messagingChannel: MessagingChannel;
}

@Schema()
export class MultiFactorSettings {
    // Set user  verification completes
    @Prop({ sparse: true, unique: true })
    @Exclude()
    @ApiProperty({ description: 'TOTP secret' })
    secret: string;

    @Prop({ type: String, enum: Utils.enumToArray(TwoFAChannels) })
    @ApiProperty({ description: '2FA channel', enum: TwoFAChannels })
    channel: TwoFAChannels;

    @Prop()
    @Exclude()
    @ApiPropertyOptional({ description: 'Recovery key hash' })
    recoveryKeyHash?: string;

    @Prop({ type: TwoFactorSettingsOptions, _id: false })
    @ApiPropertyOptional({ description: '2FA channel options', type: TwoFactorSettingsOptions })
    options?: TwoFactorSettingsOptions;

    @Prop({ default: false })
    @ApiPropertyOptional({ description: 'Whether 2FA is enabled', type: Boolean, default: false })
    enabled?: boolean;

    @Prop({ default: false })
    @ApiPropertyOptional({ description: 'Whether this is the default 2FA method', type: Boolean, default: false })
    default?: boolean;
}

const MultiFactorSettingsSchema = SchemaFactory.createForClass(MultiFactorSettings);

export class GenericServiceIntegrations {
    @Prop({ required: true })
    @ApiProperty({ description: 'Integration ID' })
    id: string;
}

@Schema()
export class ServiceIntegrations {
    @Prop({ type: GenericServiceIntegrations, _id: false })
    @ApiPropertyOptional({ description: 'OneSignal integration', type: GenericServiceIntegrations })
    onesignal: GenericServiceIntegrations;
}
const ServiceIntegrationsSchema = SchemaFactory.createForClass(ServiceIntegrations);

@Schema()
export class UserPreferences {
    @Prop({ type: String, enum: Utils.enumToArray(DashboardMode), default: DashboardMode.Sandbox })
    @ApiProperty({ description: 'Dashboard mode', enum: DashboardMode, default: DashboardMode.Sandbox })
    dashboardMode: DashboardMode;
}
const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business', 'roles', 'kyc'],
        pick: '-passwordHash -multiFactors -stateToken',
    }),
)
export class User {
    // User's firstName, settable by the user
    @Prop({ length: 50 })
    @ApiProperty({ description: 'First name' })
    firstName: string;

    // User's lastName, settable by the user
    @Prop({ length: 50 })
    @ApiProperty({ description: 'Last name' })
    lastName: string;

    // Set after the email verification completes
    @Prop({ length: 50, sparse: true, unique: true, required: true })
    @ApiProperty({ description: 'Email address' })
    email: string;

    @Prop({ sparse: true, unique: true })
    @ApiPropertyOptional({ description: 'Phone number' })
    phone: string;

    @Prop({ default: false })
    @ApiProperty({ description: 'Whether email is confirmed', type: Boolean, default: false })
    emailConfirmed: boolean;

    // A hashed password
    @Prop()
    @Exclude()
    @ApiProperty({ description: 'Hashed password' })
    passwordHash: string;

    // Account status of the user - this gives more context to status of a user
    @Prop({ type: String, enum: Utils.enumToArray(AccountStatus), default: AccountStatus.Pending })
    @ApiProperty({ description: 'Account status', enum: AccountStatus, default: AccountStatus.Pending })
    status: AccountStatus;

    // Role Ids - Array of ids representing roles a user has
    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Role' }] })
    @ApiProperty({ description: 'Role IDs', type: [String] })
    roles: any[];

    // Business the user belongs to
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    @ApiProperty({ description: 'Business ID', type: String })
    business: Business;

    @Prop({ type: StateToken, _id: false })
    @Type(() => StateToken)
    @Exclude()
    @ApiPropertyOptional({ description: 'State token for email verification', type: StateToken })
    stateToken: StateToken;

    // Two factor settings for user
    @Prop({ type: [{ type: MultiFactorSettingsSchema, _id: false, default: { enabled: false } }] })
    @Type(() => MultiFactorSettings)
    @Exclude()
    @ApiPropertyOptional({ description: 'Multi-factor authentication settings', type: [MultiFactorSettings] })
    multiFactors: MultiFactorSettings[];

    @Prop({ type: ServiceIntegrationsSchema, _id: false })
    @Type(() => ServiceIntegrations)
    @Exclude()
    @ApiPropertyOptional({ description: 'Service integrations', type: ServiceIntegrations })
    integration: ServiceIntegrations;

    @Prop({ type: UserPreferencesSchema, _id: false, default: { dashboardMode: DashboardMode.Sandbox } })
    @Type(() => UserPreferences)
    @ApiPropertyOptional({ description: 'User preferences', type: UserPreferences })
    preferences: UserPreferences;

    @ApiPropertyOptional({ description: 'Whether multi-factor auth is enabled', type: Boolean })
    multiFactorEnabled: boolean;
    @ApiPropertyOptional({ description: 'Full name (virtual)' })
    fullName: string;
    @ApiPropertyOptional({ description: 'Whether identity is confirmed', type: Boolean })
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
export const ApiHydratedUser = ApiHydrated(User);
