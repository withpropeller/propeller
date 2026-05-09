import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, Validate, ValidateIf } from 'class-validator';
import { DepositChannelType } from './account.enums';
import { MoneyAmount } from '@common/decorators/validators.decorators';

export class AccountMetricsDto {
    @ApiProperty({
        description: 'Account counts grouped by status',
        type: Object,
        example: { active: 50, 'post-no-debit': 5 },
    })
    byStatus: Record<string, number>;

    @ApiProperty({ description: 'Account counts grouped by type', type: Object, example: { main: 20, sub: 30 } })
    byType: Record<string, number>;

    @ApiProperty({ description: 'Total number of accounts', type: Number })
    total: number;
}

export class AddDepositChannelDto {
    @ApiProperty({
        example: DepositChannelType.BankAccount,
        enum: DepositChannelType,
    })
    @IsEnum(DepositChannelType)
    type: DepositChannelType;

    @ApiProperty()
    @IsString()
    accountName: string;
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

export class SetDepositChannelDto {
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

    @ApiProperty()
    @IsString()
    accountName: string;
}

export class UpdateOverdraftDto {
    @ApiProperty()
    @Validate(MoneyAmount)
    overdraftLimit: number;
}
