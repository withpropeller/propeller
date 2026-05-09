import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { FormInputTypes } from '../form-schema.enums';
import { FormValidatorDto } from './form-validator.dto';

export class FormFieldDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    label: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    disabled?: boolean;

    @ApiProperty()
    @IsString()
    @IsOptional()
    placeholder?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    column?: number;

    @ApiProperty()
    @IsEnum(FormInputTypes)
    inputType: FormInputTypes;

    @ApiProperty()
    @IsArray()
    options?: string[];

    @ApiProperty()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => FormValidatorDto)
    validators: FormValidatorDto[];
}
