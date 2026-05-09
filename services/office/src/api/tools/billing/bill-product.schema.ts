import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, enumProp, enumPropRequired } from '@core/helpers';
import { AWSObjectURL } from '@common/models/aws-object';
import { BillPaymentVendor, BillingCategory, BillProductFieldType, BillProductStatus } from './bill-product.enums';
import { FeeStructure } from '@api/fees/fee.schema';
import { Schema as MongooseSchema } from 'mongoose';
import { TransactionCurrency } from '@api/transactions/transactions.enums';

@Schema()
export class BillProductFieldOption {
    @Prop()
    key: string;

    @Prop()
    name: string;

    @Prop()
    value: number;
}
export const BillProductFieldOptionSchema = SchemaFactory.createForClass(BillProductFieldOption);

@Schema()
export class BillProductFieldValidator {
    @Prop()
    pattern?: string;

    @Prop()
    minLength?: number;

    @Prop()
    maxLength?: number;

    @Prop()
    min?: number;

    @Prop()
    max?: number;

    @Prop({ default: true })
    required?: boolean;

    @Prop()
    email?: boolean;

    @Prop()
    phoneNumber?: boolean;

    @Prop()
    moneyAmount?: boolean;
}
export const BillProductFieldValidatorSchema = SchemaFactory.createForClass(BillProductFieldValidator);

@Schema()
export class ProductFee {
    @Prop({ required: true })
    value: number;

    @Prop()
    cap?: number;

    @Prop(enumPropRequired(FeeStructure))
    structure: FeeStructure;
}
export const ProductFeeSchema = SchemaFactory.createForClass(ProductFee);

@Schema()
export class BillProductField {
    @Prop({ required: true })
    key: string;

    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop(enumPropRequired(BillProductFieldType))
    type: BillProductFieldType;

    @Prop({ type: BillProductFieldValidatorSchema, _id: false })
    validator: BillProductFieldValidator;

    @Prop({
        type: [{ type: BillProductFieldOptionSchema, _id: false }],
        default: void 0,
    })
    options?: BillProductFieldOption[];
}
export const BillProductFieldSchema = SchemaFactory.createForClass(BillProductField);

@Schema()
export class BillProductResponseMap {
    @Prop({ default: false })
    key: string;

    @Prop({ default: false })
    name: string;
}
export const BillProductResponseMapSchema = SchemaFactory.createForClass(BillProductResponseMap);

@Schema()
export class BillProductVendorConfig {
    @Prop(enumPropRequired(BillPaymentVendor))
    vendor: BillPaymentVendor;

    @Prop()
    priority: number;

    @Prop({ type: ProductFeeSchema, _id: false })
    commission: ProductFee;

    @Prop({ type: ProductFeeSchema, _id: false })
    fee: ProductFee;

    @Prop({ type: MongooseSchema.Types.Mixed })
    bodyJson: Record<string, any>;

    @Prop({ type: MongooseSchema.Types.Mixed })
    responseRemaps?: Record<string, string>;
}
export const BillProductVendorConfigSchema = SchemaFactory.createForClass(BillProductVendorConfig);

@Schema(
    ModelSchemaOptions({
        objectIds: ['parent:bp', 'children:bp'],
        tag: ModelIdTag.BillProduct,
    }),
)
export class BillProduct {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BillProduct' })
    parent?: any;

    @Prop()
    countryCode: string;

    @Prop(enumProp(TransactionCurrency))
    currency: TransactionCurrency;

    @Prop(enumPropRequired(BillingCategory))
    category: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({
        type: [{ type: BillProductFieldSchema, _id: false }],
        default: void 0,
    })
    fields?: BillProductField[];

    @Prop()
    amountField?: string;

    @Prop()
    recipientRefField?: string;

    @Prop({ default: false })
    hasRemoteValidation?: boolean;

    @Prop({
        type: [{ type: BillProductResponseMapSchema, _id: false }],
        default: void 0,
    })
    responseMaps?: BillProductResponseMap[];

    @Prop({
        type: [{ type: BillProductVendorConfigSchema, _id: false }],
        default: void 0,
    })
    vendorConfigs?: BillProductVendorConfig[];

    @Prop({ type: AWSObjectURL, _id: false })
    icon: AWSObjectURL;

    @Prop({
        type: [MongooseSchema.Types.ObjectId],
        ref: 'BillProduct',
        default: void 0,
    })
    children?: BillProduct[];

    @Prop(enumProp(BillProductStatus, BillProductStatus.Active))
    status?: BillProductStatus;
}
export const BillProductSchema = SchemaFactory.createForClass(BillProduct);
