import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class AWSObjectURL {
    @Prop()
    keyName: string;

    @Prop()
    url: string;

    @Prop({ type: Date, default: Date.now() })
    createdAt?: string;

    @Prop()
    note?: string;
}

export const AWSObjectURLSchema = SchemaFactory.createForClass(AWSObjectURL);
