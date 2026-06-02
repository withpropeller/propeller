import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiVersions, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { SecretKeyScopes, SecretKeyStatus } from './secret-key.enums';
import { Business } from '@api/business/business.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

// https://www.freecodecamp.org/news/best-practices-for-building-api-keys-97c26eabfea9/

@Schema(ModelSchemaOptions(['business'], '-key -business'))
export class SecretKey {
    @Prop({ required: true })
    @ApiProperty({ description: 'Secret key name' })
    name: string;

    @Exclude()
    @Prop({ required: true, unique: true })
    @ApiProperty({ description: 'Generated secret key value' })
    key: string;

    @Prop([String])
    @ApiProperty({ description: 'Allowed scopes for this key', enum: SecretKeyScopes, isArray: true })
    scopes: SecretKeyScopes[];

    @Prop({
        type: String,
        enum: Utils.enumToArray(ApiVersions),
        default: ApiVersions.Current,
    })
    @ApiPropertyOptional({
        description: 'API version assigned to this key',
        enum: ApiVersions,
        default: ApiVersions.Current,
    })
    apiVersion?: ApiVersions;

    @Prop({
        type: String,
        enum: Utils.enumToArray(SecretKeyStatus),
        default: SecretKeyStatus.Active,
    })
    @ApiPropertyOptional({
        description: 'Current status of the key',
        enum: SecretKeyStatus,
        default: SecretKeyStatus.Active,
    })
    status?: SecretKeyStatus;

    @Prop({ type: Boolean, default: false })
    @ApiPropertyOptional({ description: 'Whether GRP is enabled for this key', type: Boolean, default: false })
    grpEnabled?: boolean;

    @Prop({ type: [String], default: void 0 })
    @ApiPropertyOptional({ description: 'CIDR whitelist for this key', type: [String] })
    cidrWhitelist?: string[];

    @Exclude()
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: Business.name })
    @ApiProperty({ description: 'Business ID', type: String })
    business: Business;

    @Prop(Date)
    @ApiPropertyOptional({ description: 'Last time the key was used', type: Date })
    lastUsed?: Date;
}

export const SecretKeySchema = SchemaFactory.createForClass(SecretKey);

SecretKeySchema.virtual('prefix').get(function (this: SecretKey) {
    return this.key.slice(0, this.key.lastIndexOf('.'));
});

export const ApiHydratedSecretKey = ApiHydrated(SecretKey);
