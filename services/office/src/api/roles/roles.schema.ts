import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelSchemaOptions } from '@core/helpers';
import { Permissions } from './roles.enums';

@Schema(ModelSchemaOptions())
export class Role {
    @Prop({ length: 50 })
    name: string;

    @Prop({ unique: true })
    slug: string;

    @Prop({ type: [String] })
    permissions: Permissions[];

    publicId: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
