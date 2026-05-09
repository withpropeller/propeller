import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsNumberString,
    Length,
    IsString,
    IsNotEmpty,
    ArrayNotEmpty,
    ValidateNested,
    IsOptional,
    IsUrl,
    MaxLength,
    MinLength,
    IsNumber,
    IsEnum,
} from 'class-validator';

export class ResolveBankAccountDto {
    @ApiProperty()
    @IsNumberString()
    @Length(10, 10)
    accountNumber: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    bankCode: string;
}

export class BankShortListDto {
    @IsNumberString()
    @Length(10, 10)
    accountNumber: string;
}

export class AddBankListDto {
    @ApiProperty()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BankDto)
    banks: BankDto[];
}

export class ProcessorBanksMapsDto {
    @ApiProperty()
    @IsEnum(TransactionProcessor)
    processor: TransactionProcessor;

    @ApiProperty()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BankMappingDto)
    mappings: BankMappingDto[];
}

export class BankDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    @MaxLength(6)
    @MinLength(3)
    code: string;

    @ApiProperty()
    @IsNumber()
    rank: number;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    abbr: string;

    @ApiProperty()
    @IsUrl()
    imageUrl: string;
}

export class BankMappingDto {
    @ApiProperty()
    @IsString()
    @MaxLength(6)
    @MinLength(6)
    code: string;

    @ApiProperty()
    @IsString()
    @MaxLength(6)
    @MinLength(3)
    processorCode: string;
}
