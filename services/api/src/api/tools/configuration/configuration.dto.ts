import { IsTagId } from '@common/decorators/validators.decorators';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Validate, IsOptional, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';

export class PaymentConfigurationFeesDto {
    @ApiPropertyOptional({ example: 'fee.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Fee]))
    @Validate(IsTagId)
    @IsOptional()
    bankTransfer: Types.ObjectId;

    @ApiPropertyOptional({ example: 'fee.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Fee]))
    @Validate(IsTagId)
    @IsOptional()
    billPayment: Types.ObjectId;
}

export class PaymentConfigurationDto {
    @ApiPropertyOptional({ example: 'ac.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Account]))
    @Validate(IsTagId)
    @IsOptional()
    payInAccount: Types.ObjectId;

    @ApiPropertyOptional({ example: 'ac.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Account]))
    @Validate(IsTagId)
    @IsOptional()
    payOutAccount: Types.ObjectId;

    @ApiPropertyOptional()
    @ValidateNested()
    @Type(() => PaymentConfigurationFeesDto)
    @IsOptional()
    fees: PaymentConfigurationFeesDto;
}
