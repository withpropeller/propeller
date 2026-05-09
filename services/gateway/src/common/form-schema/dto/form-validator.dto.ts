import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { FormValidatorTypes } from '../form-schema.enums';

export class FormValidatorDto {
    @ApiProperty()
    @IsEnum(FormValidatorTypes)
    name: string;

    @ApiProperty()
    @IsArray()
    @IsOptional()
    args?: any[];
}
