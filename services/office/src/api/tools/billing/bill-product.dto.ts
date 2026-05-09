import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsEnum,
    IsISO31661Alpha2,
    IsNotEmptyObject,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUrl,
    Min,
    Validate,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { BillProductFieldType, BillPaymentVendor, BillingCategory } from './bill-product.enums';
import { FeeStructure } from '@api/fees/fee.schema';
import { MoneyAmount, IsTagId } from '@common/decorators/validators.decorators';
import { Utils } from '@core/helpers';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { ModelIdTag, ParseTagId } from '@core/mongo';

export class BillingFeeDto {
    @ApiProperty()
    @IsEnum(FeeStructure)
    structure: FeeStructure;

    @ApiProperty()
    @Transform((v) => Utils.safeNumber(v.value))
    @IsNumber()
    @Min(0)
    value: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform((v) => Utils.safeNumber(v.value))
    @Validate(MoneyAmount)
    cap: number;
}

export class RemoteValidationResponseMapsDto {
    @ApiProperty()
    @IsString()
    key: string;

    @ApiProperty()
    @IsString()
    name: string;
}

export class BillPaymentFieldValidatorDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    pattern?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    minLength?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    maxLength?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    min?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    max?: number;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    required?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    phoneNumber?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    email?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    moneyAmount?: boolean;
}
export class BillPaymentFieldOptionDto {
    @ApiProperty()
    @IsString()
    key: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    value: number;
}

export class BillProductFieldDto {
    @ApiProperty()
    @IsString()
    key: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: BillProductFieldType })
    @IsEnum(BillProductFieldType)
    type: BillProductFieldType;

    @ApiPropertyOptional()
    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => BillPaymentFieldValidatorDto)
    validator: BillPaymentFieldValidatorDto;

    @ApiPropertyOptional()
    @IsArray()
    @IsOptional()
    @ArrayNotEmpty()
    @ValidateNested()
    @Type(() => BillPaymentFieldOptionDto)
    options?: BillPaymentFieldOptionDto[];
}

export class BillProductVendorConfigDto {
    @ApiProperty({
        enum: BillPaymentVendor,
        example: BillPaymentVendor.ProviPay,
    })
    @IsEnum(BillPaymentVendor)
    vendor: BillPaymentVendor;

    @ApiProperty()
    @IsNumber()
    priority: number;

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => BillingFeeDto)
    commission: BillingFeeDto;

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => BillingFeeDto)
    fee: BillingFeeDto;

    @ApiProperty()
    @IsNotEmptyObject()
    bodyJson: any;

    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    @IsNotEmptyObject()
    responseRemaps?: Record<string, string>;
}

export class CreateBillProductDto {
    @ApiPropertyOptional({ example: 'bp.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.BillProduct]))
    @Validate(IsTagId)
    @IsOptional()
    parent?: string;

    @ApiPropertyOptional()
    @ValidateIf((v) => v.fields && v.fields.length > 0)
    @IsISO31661Alpha2()
    countryCode: string;

    @ApiPropertyOptional({
        enum: TransactionCurrency,
        example: TransactionCurrency.NGN,
    })
    @ValidateIf((v) => v.fields && v.fields.length > 0)
    @IsEnum(TransactionCurrency)
    currency: TransactionCurrency;

    @ApiProperty()
    @IsEnum(BillingCategory)
    category: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsArray()
    @ValidateNested()
    @IsOptional()
    @Type(() => BillProductFieldDto)
    fields?: BillProductFieldDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    amountField?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    recipientRefField?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    hasRemoteValidation: boolean;

    @ApiPropertyOptional()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @IsArray()
    @ValidateIf((o) => o.hasRemoteValidation)
    @Type(() => RemoteValidationResponseMapsDto)
    responseMaps: RemoteValidationResponseMapsDto[];

    @ApiPropertyOptional()
    @IsObject({ each: true })
    @ValidateNested()
    @IsOptional()
    @IsArray()
    @Type(() => BillProductVendorConfigDto)
    vendorConfigs?: BillProductVendorConfigDto[];

    @ApiPropertyOptional()
    @IsUrl()
    @IsOptional()
    iconUrl?: string;
}

export class UpdateBillProductDto {
    @ApiPropertyOptional({ example: 'bp.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.BillProduct]))
    @Validate(IsTagId)
    @IsOptional()
    parent?: string;

    @ApiPropertyOptional()
    @IsISO31661Alpha2()
    @IsOptional()
    countryCode?: string;

    @ApiPropertyOptional({
        enum: TransactionCurrency,
        example: TransactionCurrency.NGN,
    })
    @IsEnum(TransactionCurrency)
    @IsOptional()
    currency: TransactionCurrency;

    @ApiPropertyOptional()
    @IsEnum(BillingCategory)
    @IsOptional()
    category?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsArray()
    @ValidateNested()
    @IsOptional()
    @Type(() => BillProductFieldDto)
    fields?: BillProductFieldDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    amountField?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    recipientRefField: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    hasRemoteValidation: boolean;

    @ApiPropertyOptional()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @IsArray()
    @ValidateIf((o) => o.hasRemoteValidation)
    @Type(() => RemoteValidationResponseMapsDto)
    responseMaps: RemoteValidationResponseMapsDto[];

    @ApiPropertyOptional()
    @IsObject({ each: true })
    @ValidateNested()
    @IsArray()
    @IsOptional()
    @Type(() => BillProductVendorConfigDto)
    vendorConfigs?: BillProductVendorConfigDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsUrl()
    iconUrl?: string;
}
