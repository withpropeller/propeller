import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, Length, IsString, IsNotEmpty } from 'class-validator';

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

export interface ITransferSettings {
    processor: TransactionProcessor;
    feeTiers: Array<{ limit: number; fee: number }>;
}
