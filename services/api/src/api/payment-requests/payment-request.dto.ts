import { VirtualAccountPartner } from '@api/account/account.enums';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { MoneyAmount, IsTagId } from '@common/decorators/validators.decorators';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsEnum,
    IsNotEmpty,
    IsNotEmptyObject,
    IsObject,
    IsOptional,
    IsString,
    Validate,
    ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { PaymentRequestMethod } from './payment.request.enums';

export class PaymentRequestOptionsBankTransferDto {
    @ApiProperty()
    @IsString({ groups: [PaymentRequestMethod.BankTransfer] })
    @IsNotEmpty()
    accountName: string;

    @ApiPropertyOptional({
        enum: VirtualAccountPartner,
        example: VirtualAccountPartner.Providus,
    })
    @IsOptional()
    @IsEnum(VirtualAccountPartner, { groups: [PaymentRequestMethod.BankTransfer] })
    bank?: string;
}

export class PaymentRequestBankTransferOptionsDto {
    @ApiPropertyOptional()
    @Type(() => PaymentRequestOptionsBankTransferDto)
    @ValidateNested()
    bankTransfer: PaymentRequestOptionsBankTransferDto;
}

export class PaymentRequestPaymentAuthorizationOptionsDto {
    @ApiPropertyOptional()
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.PaymentAuthorization]))
    @Validate(IsTagId)
    authorization: Types.ObjectId;
}
export class CreatePaymentRequestBankTransferDto implements ICreatePaymentRequestDto {
    @ApiProperty({
        enum: PaymentRequestMethod,
        example: PaymentRequestMethod.BankTransfer,
    })
    @IsEnum(PaymentRequestMethod)
    method: PaymentRequestMethod;

    @ApiProperty()
    @Type(() => PaymentRequestBankTransferOptionsDto)
    @ValidateNested()
    options: PaymentRequestBankTransferOptionsDto;

    @ApiProperty({
        enum: TransactionCurrency,
        example: TransactionCurrency.NGN,
    })
    @IsEnum(TransactionCurrency)
    currency: TransactionCurrency;

    @ApiProperty({ example: 10000 })
    @Validate(MoneyAmount)
    amount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    customer?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    reference?: string;

    @ApiPropertyOptional({ example: 'ac.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Account]))
    @Validate(IsTagId)
    @IsOptional()
    account?: Types.ObjectId;

    @ApiPropertyOptional({ type: 'object', additionalProperties: true, example: { key: 'value' } })
    @IsOptional()
    @IsObject()
    @IsNotEmptyObject()
    metadata?: Record<string, any>;
}

export class CreatePaymentRequestPaymentAuthorizationDto implements ICreatePaymentRequestDto {
    @ApiProperty({
        enum: PaymentRequestMethod,
        example: PaymentRequestMethod.BankTransfer,
    })
    @IsEnum(PaymentRequestMethod)
    method: PaymentRequestMethod;

    @ApiProperty()
    @Type(() => PaymentRequestPaymentAuthorizationOptionsDto)
    @ValidateNested()
    options: PaymentRequestPaymentAuthorizationOptionsDto;

    @ApiProperty({
        enum: TransactionCurrency,
        example: TransactionCurrency.NGN,
    })
    @IsEnum(TransactionCurrency)
    currency: TransactionCurrency;

    @ApiProperty({ example: 10000 })
    @Validate(MoneyAmount)
    amount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    customer?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    reference?: string;

    @ApiPropertyOptional({ example: 'ac.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Account]))
    @Validate(IsTagId)
    @IsOptional()
    account?: Types.ObjectId;

    @ApiPropertyOptional({ type: 'object', additionalProperties: true, example: { key: 'value' } })
    @IsOptional()
    @IsObject()
    @IsNotEmptyObject()
    metadata?: Record<string, any>;
}

export interface ICreatePaymentRequestDto {
    method: PaymentRequestMethod;
    options: {
        bankTransfer?: PaymentRequestOptionsBankTransferDto;
        authorization?: Types.ObjectId;
    };
    currency: TransactionCurrency;
    amount: number;
    description?: string;
    customer?: string;
    reference?: string;
    account?: Types.ObjectId;
    metadata?: Record<string, any>;
}
