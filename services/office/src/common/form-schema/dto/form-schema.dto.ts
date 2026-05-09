import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { FormFieldDto } from './form-field.dto';

export class FormSchemaDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => FormFieldDto)
    fields: FormFieldDto[];
}
