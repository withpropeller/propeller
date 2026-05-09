import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, enumPropRequired } from '@core/helpers';
import { AWSObjectURL } from '@common/models/aws-object';
import { MerchantCategory } from './merchant.enums';

@Schema()
export class MerchantPattern {
    @Prop()
    affix: string;

    @Prop([{ type: String }])
    keywords: string[];

    @Prop([{ type: String }])
    samples?: string[];
}

export const MerchantPatternSchema = SchemaFactory.createForClass(MerchantPattern);

@Schema(
    ModelSchemaOptions({
        objectIds: [],
        tag: ModelIdTag.Merchant,
    }),
)
export class Merchant {
    @Prop()
    name: string;

    @Prop(enumPropRequired(MerchantCategory))
    category: string;

    @Prop()
    incorporatedName: string;

    @Prop()
    mcc: string;

    @Prop({ type: AWSObjectURL, _id: false })
    icon: AWSObjectURL;

    @Prop({ type: [MerchantPatternSchema], _id: false })
    patterns: MerchantPattern[];
}
export const MerchantSchema = SchemaFactory.createForClass(Merchant);
