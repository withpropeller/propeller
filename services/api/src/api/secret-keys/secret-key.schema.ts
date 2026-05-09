import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiVersion, Utils } from '@core/helpers';
import { ModelSchemaOptions } from '@core/mongo';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { SecretKeyPermissions, SecretKeyStatus } from './secret-key.enums';

// https://www.freecodecamp.org/news/best-practices-for-building-api-keys-97c26eabfea9/
@Schema(ModelSchemaOptions(['business'], '-key'))
export class SecretKey {
    @Prop({ required: true })
    name: string;

    @Exclude()
    @Prop({ required: true, unique: true })
    key: string;

    @Prop([String])
    scopes: SecretKeyPermissions[];

    @Prop({
        type: String,
        enum: Utils.enumToArray(ApiVersion),
    })
    apiVersion?: ApiVersion;

    @Prop({
        type: String,
        enum: Utils.enumToArray(SecretKeyStatus),
        default: SecretKeyStatus.Active,
    })
    status?: SecretKeyStatus;

    @Prop({ type: [String], default: void 0 })
    cidrWhitelist?: string[];

    @Prop({ type: Boolean, default: false })
    grpEnabled?: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: any;

    @Prop(Date)
    lastUsed?: Date;
}

export const SecretKeySchema = SchemaFactory.createForClass(SecretKey);

SecretKeySchema.virtual('prefix').get(function (this: SecretKey) {
    return this.key.slice(0, this.key.lastIndexOf('.'));
});
