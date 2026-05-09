import { IsTagId } from '@common/decorators/validators.decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNotEmptyObject,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    Validate,
    ValidateIf,
} from 'class-validator';
import { AccountCurrency, AccountType, DepositChannelType } from './account.enums';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { Types } from 'mongoose';

export class CreateAccountDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Account]))
    @Validate(IsTagId)
    @IsOptional()
    settlementAccount?: Types.ObjectId;

    @ApiPropertyOptional({ description: 'Account Reference' })
    @IsString()
    @IsOptional()
    @MaxLength(64)
    @IsNotEmpty()
    reference?: string;

    @ApiPropertyOptional()
    @IsString()
    @ValidateIf((o) => o.type != AccountType.Main)
    @IsNotEmpty()
    customer?: string;

    @ApiProperty({
        example: AccountCurrency.NGN,
        enum: AccountCurrency,
    })
    @IsEnum(AccountCurrency)
    currency: AccountCurrency;

    @ApiProperty({ example: AccountType.Main, enum: AccountType })
    @IsEnum(AccountType)
    type: AccountType;

    @ApiPropertyOptional({
        example: [DepositChannelType.BankAccount],
        enum: DepositChannelType,
    })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateIf((o) => o.type == AccountType.Virtual)
    @IsEnum(DepositChannelType, { each: true })
    depositChannels?: DepositChannelType[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    @IsNotEmptyObject()
    metadata?: Record<string, any>;
}

export class AddDepositChannelDto {
    @ApiProperty({
        example: DepositChannelType.BankAccount,
        enum: DepositChannelType,
    })
    @IsEnum(DepositChannelType)
    type: DepositChannelType;
}

export class RefreshDepositChannelDto {
    @ApiProperty({
        example: DepositChannelType.BankAccount,
        enum: DepositChannelType,
    })
    @IsEnum(DepositChannelType)
    type: DepositChannelType;

    @ApiPropertyOptional()
    @IsString()
    @ValidateIf((o) => o.type == DepositChannelType.BankAccount)
    accountNumber: string;
}

export class GenerateStatementDto {
    @ApiPropertyOptional({
        description: 'Timezone',
        example: 'Africa/Lagos',
    })
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    timezone: string;

    @ApiProperty({ description: 'Start Date', example: '2021-01-01' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ description: 'End Date', example: '2021-12-31' })
    @IsDateString()
    endDate: string;
}
