import { MoneyAmount } from '@common/decorators/validators.decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Validate } from 'class-validator';
import { AccountCurrency, AccountType, DepositChannelType } from './account.enums';

export class RequestOverdraftDto {
    @ApiProperty()
    @Validate(MoneyAmount)
    overdraftLimit: number;
}

export class CreateAccountDto {
    @ApiProperty()
    name: string;

    @ApiPropertyOptional({ example: 'ac.2cbc123456', description: 'Settlement Account ID' })
    settlementAccount?: string;

    @ApiPropertyOptional({ description: 'Account Reference' })
    reference?: string;

    @ApiPropertyOptional({ description: 'Customer ID or reference' })
    customer?: string;

    @ApiProperty({ example: AccountCurrency.NGN, enum: AccountCurrency })
    currency: AccountCurrency;

    @ApiProperty({ example: AccountType.Main, enum: AccountType })
    type: AccountType;

    @ApiPropertyOptional({ example: [DepositChannelType.BankAccount], enum: DepositChannelType, isArray: true })
    depositChannels?: DepositChannelType[];

    @ApiPropertyOptional({ type: Object })
    metadata?: Record<string, any>;
}

export class AddDepositChannelDto {
    @ApiProperty({ example: DepositChannelType.BankAccount, enum: DepositChannelType })
    type: DepositChannelType;
}
