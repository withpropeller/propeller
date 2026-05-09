import { IsTagId } from '@common/decorators/validators.decorators';
import { ParseTagId } from '@core/mongo';
import { ArgsType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsString,
    MinLength,
    MaxLength,
    IsNotEmpty,
    Validate,
    IsMongoId,
    IsArray,
    ArrayNotEmpty,
} from 'class-validator';
import { Types } from 'mongoose';

export class ParamIdDto {
    @ApiProperty()
    @IsString()
    id: string;
}

@ArgsType()
export class ParamMongoIdDto {
    @Field()
    @ApiProperty()
    @IsMongoId()
    id: string;
}

export class ParamTagIdDto {
    @ApiProperty()
    @Transform((v) => ParseTagId(v.value))
    @Validate(IsTagId)
    id: Types.ObjectId;
}

export class StateTokenDto {
    @ApiProperty()
    @MaxLength(16)
    @MinLength(16)
    stateToken: string;
}

export class MulterFileDto {
    @IsString()
    fieldname;

    @IsString()
    originalname;

    @IsString()
    encoding;

    @IsString()
    mimetype;

    @IsNotEmpty()
    buffer;

    @IsString()
    size;
}

export class ItemArrayStringDto {
    @ApiProperty()
    @IsString({ each: true })
    @IsArray()
    @ArrayNotEmpty()
    items: string[];
}
