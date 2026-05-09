import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions } from '@core/mongo';
import { AWSObjectURL } from '@common/models/aws-object';
import { HydratedDocument } from 'mongoose';

@Schema()
export class MerchantPattern {
    @Prop()
    affix: string;

    @Prop([{ type: String }])
    keywords: string[];
}

export const MerchantPatternSchema = SchemaFactory.createForClass(MerchantPattern);

@Schema(
    ModelSchemaOptions({
        objectIds: [],
        tag: ModelIdTag.Merchant,
        pick: '-icon -patterns -samples',
    }),
)
export class Merchant {
    @Prop()
    name: string;

    @Prop()
    incorporatedName: string;

    @Prop()
    mcc: string;

    @Prop({ type: AWSObjectURL, _id: false })
    icon: AWSObjectURL;

    @Prop({ type: [MerchantPatternSchema], _id: false })
    patterns: MerchantPattern[];

    @Prop([{ type: String }])
    samples: string[];
}
export const MerchantSchema = SchemaFactory.createForClass(Merchant);

MerchantSchema.virtual('iconUrl').get(function (this: HydratedDocument<Merchant>) {
    return this.icon ? this.icon.url : undefined;
});
