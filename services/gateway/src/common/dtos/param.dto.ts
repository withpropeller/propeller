import { TagId } from '@common/decorators/validators.decorators';
import { Utils } from '@core/helpers';
import { ArgsType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength, MaxLength, IsNotEmpty, Validate, IsMongoId } from 'class-validator';
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
    id: Types.ObjectId;
}

export class ParamTagIdDto {
    @Field()
    @ApiProperty()
    @Transform((v) => Utils.parseIdTag(v.value))
    @Validate(TagId)
    id: string;
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
