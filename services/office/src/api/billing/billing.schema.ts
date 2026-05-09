import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelSchemaOptions, enumPropRequired, ModelIdTag, enumProp } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { BillableKeys, BillableUnits, BillingPeriod, BillingStatus } from './billing.enums';
import { AWSObjectURL } from '@common/models/aws-object';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

@Schema(
    ModelSchemaOptions({
        objectIds: ['product:#productRef'],
        pick: '-productRef',
    }),
)
export class BillingItem {
    @Prop(enumPropRequired(BillableKeys))
    @ApiProperty({ description: 'Billable key', enum: BillableKeys })
    billable: BillableKeys;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'productRef', required: true })
    @ApiProperty({ description: 'Product document ID', type: String })
    product: any;

    @Prop({ type: String, required: true })
    @ApiProperty({ description: 'Product model reference name' })
    productRef: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Quantity billed', type: Number })
    quantity: number;

    @Prop(enumPropRequired(BillableUnits))
    @ApiProperty({ description: 'Unit of measurement', enum: BillableUnits })
    unit: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Price per unit in lowest currency unit', type: Number })
    unitPrice: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Total billable price in lowest currency unit', type: Number })
    billablePrice: number;
}
const BillingItemSchema = SchemaFactory.createForClass(BillingItem);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz'],
        tag: ModelIdTag.Billing,
    }),
)
export class Billing {
    @Prop({ unique: true, required: true })
    @ApiProperty({ description: 'Invoice number' })
    invoiceNo: string;

    @Prop({ type: String, required: true })
    @ApiProperty({ description: 'Billing period (YYYY-M format)' })
    period: BillingPeriod;

    @Prop({ required: true })
    @ApiProperty({ description: 'List amount before adjustments in lowest currency unit', type: Number })
    listAmount: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Billed amount in lowest currency unit', type: Number })
    billedAmount: number;

    @Prop()
    @ApiPropertyOptional({ description: 'Amount still due in lowest currency unit', type: Number })
    dueAmount: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Payment due date', type: Date })
    dueDate: Date;

    @Prop({ type: [{ type: BillingItemSchema, _id: false }] })
    @ApiProperty({ description: 'Line items in this billing', type: [BillingItem] })
    items: BillingItem[];

    @Prop(enumPropRequired(TransactionCurrency))
    @ApiProperty({ description: 'Billing currency', enum: TransactionCurrency })
    currency: TransactionCurrency;

    @Prop(enumProp(BillableKeys, BillingStatus.Pending))
    @ApiProperty({ description: 'Billing status', enum: BillingStatus })
    status: BillingStatus;

    @Prop({ type: AWSObjectURL, _id: false })
    @ApiPropertyOptional({ description: 'Invoice PDF document', type: AWSObjectURL })
    invoicePdf: AWSObjectURL;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business', required: true })
    business: any;
}

export const BillingSchema = SchemaFactory.createForClass(Billing);
BillingSchema.index({ business: 1, period: 1, currency: 1 }, { unique: true });
export const ApiHydratedBilling = ApiHydrated(Billing);
