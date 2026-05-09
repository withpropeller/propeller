import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiVersions, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { SecretKeyScopes } from './secret-key.enums';
import { Business } from '@api/business/business.schema';

// https://www.freecodecamp.org/news/best-practices-for-building-api-keys-97c26eabfea9/

@Schema(ModelSchemaOptions(['business:bz'], '-key'))
export class SecretKey {
    @Prop({ required: true })
    name: string;

    @Exclude()
    @Prop({ required: true, unique: true })
    key: string;

    @Prop([String])
    scopes: SecretKeyScopes[];

    @Prop({
        type: String,
        enum: Utils.enumToArray(ApiVersions),
        default: ApiVersions.Current,
    })
    apiVersion?: ApiVersions;

    @Prop({ type: [String], default: void 0 })
    cidrWhitelist?: string[];

    @Exclude()
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: Business.name })
    business: Business;

    @Prop(Date)
    lastUsed?: Date;
}

export const SecretKeySchema = SchemaFactory.createForClass(SecretKey);

SecretKeySchema.virtual('prefix').get(function (this: SecretKey) {
    return this.key.slice(0, this.key.lastIndexOf('.'));
});
