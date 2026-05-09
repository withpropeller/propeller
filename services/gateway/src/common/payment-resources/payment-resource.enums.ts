import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsEnum, IsMongoId, IsNumber, IsPositive, Min, ValidateIf } from 'class-validator';

export enum SpendingLimitType {
    AutoRenew = 'AUTO_RENEW',
    OneOff = 'ONE_OFF',
    SingleUse = 'SINGLE_USE',
}

export enum SpendingCurrency {
    USD = 'USD',
    NGN = 'NGN',
}

export enum SpendingLimitFrequency {
    Daily = 'DAILY',
    Weekly = 'WEEKLY',
    Monthly = 'MONTHLY',
}

export enum PaymentResourceStatus {
    RequiresSetup = 'REQUIRES_SETUP',
    RequiresActivation = 'REQUIRES_ACTIVATION',
    Active = 'ACTIVE',
    Frozen = 'FROZEN',
    Retired = 'RETIRED',
}
export const PaymentResourceIncongitos = [PaymentResourceStatus.RequiresSetup];

export enum SpendingPolicyType {
    ApprovalLimit = 'APPROVAL_LIMIT',
    WithdrawalLimit = 'WITHDRAWAL_LIMIT',
    Document = 'DOCUMENT',
}

export class SpendingPolicyDto {
    @ApiProperty()
    @IsEnum(SpendingPolicyType)
    type: SpendingPolicyType;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty()
    @IsMongoId({ each: true })
    @ArrayNotEmpty()
    @ValidateIf((o) => o.type === SpendingPolicyType.ApprovalLimit)
    approvers: string[];

    @ApiProperty()
    @IsNumber()
    @IsPositive()
    @ValidateIf((o) => o.type === SpendingPolicyType.ApprovalLimit)
    minimumApprovers: number;

    @ApiProperty()
    @IsEnum(SpendingLimitFrequency)
    @ValidateIf((o) => o.type === SpendingPolicyType.WithdrawalLimit)
    frequency: SpendingLimitFrequency;
}

export interface SpendingConfigPolicyData {
    amountAndFees: number;
    file?: Express.Multer.File;
}
