import { IsTagId } from '@common/decorators/validators.decorators';
import { ParseTagId } from '@core/mongo';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Validate } from 'class-validator';
import { Types } from 'mongoose';

export class ParamIdDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id: string;
}

export class ParamTagIdDto {
    @ApiProperty()
    @Transform((v) => ParseTagId(v.value))
    @Validate(IsTagId)
    id: Types.ObjectId;
}

export class ParamTwoTagIdDto {
    @ApiProperty()
    @Transform((v) => ParseTagId(v.value))
    @Validate(IsTagId)
    id: string;

    @ApiProperty()
    @Transform((v) => ParseTagId(v.value))
    @Validate(IsTagId)
    id2: string;
}
