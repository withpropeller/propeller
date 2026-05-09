import { AccountCurrency, DepositChannelType } from '@api/account/account.enums';
import { MoneyAmount } from '@common/decorators/validators.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Validate } from 'class-validator';

export class CreateReserveAccountDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    slug: string;

    @ApiProperty({ enum: AccountCurrency, example: AccountCurrency.NGN })
    @IsEnum(AccountCurrency)
    currency: AccountCurrency;
}

export class DebitReserveAccountDto {
    @ApiProperty()
    @Validate(MoneyAmount)
    amount: number;
}

export class AddDepositChannelDto {
    @ApiProperty({
        example: DepositChannelType.BankAccount,
        enum: DepositChannelType,
    })
    @IsEnum(DepositChannelType)
    type: DepositChannelType;
}
