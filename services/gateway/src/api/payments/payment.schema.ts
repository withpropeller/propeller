import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';
import { TransactionCurrency } from '@api/transactions/transactions.enums';

export enum PaymentType {
    PayIn = 'pay-in',
    PayOut = 'pay-out',
    Charge = 'charge',
    Bill = 'bill',
    Local = 'local',
}

export enum PaymentStatus {
    Queued = 'queued',
    New = 'new',
    Pending = 'pending',
    Failed = 'failed',
    Success = 'success',
    Expired = 'expired',
}

export enum PaymentFailureReason {
    InsufficientFunds = 'insufficient-funds',
}

export enum PaymentMethod {
    BankTransfer = 'bank-transfer',
    Transfer = 'transfer',
    LocalTransfer = 'local-transfer',
    Refund = 'refund',
}

export enum PaymentTimelineAction {
    Initiated = 'initiated',
    SentForReversal = 'sent-for-reversal',
    FundsDebited = 'funds-debited',
}

export enum PaymentTimelineDataCode {
    SystemError = 'system-error',
    InsufficientFunds = 'insufficient-funds',
}

export class BankTransferPaymentMethodData {
    @ApiProperty({ description: 'Bank code' })
    bankCode: string;

    @ApiProperty({ description: 'Bank name' })
    bankName: string;

    @ApiProperty({ description: 'Destination account number' })
    accountNumber: string;

    @ApiProperty({ description: 'Destination account name' })
    accountName: string;

    @ApiProperty({ description: 'Source account name' })
    sourceAccountName: string;

    @ApiPropertyOptional({ description: 'Transfer narration' })
    narration?: string;
}

export class LocalTransferPaymentMethodData {
    @ApiPropertyOptional({ description: 'Destination account ID', type: String })
    destination?: any;

    @ApiPropertyOptional({ description: 'Source account ID', type: String })
    source?: any;

    @ApiPropertyOptional({ description: 'Transfer note' })
    note?: string;
}

export class RefundPaymentMethodData {
    @ApiPropertyOptional({ description: 'Refund remarks' })
    remarks?: string;

    @ApiPropertyOptional({ description: 'Related object ID', type: String })
    for?: any;
}

export class PaymentMethodData {
    @ApiPropertyOptional({ description: 'Bank transfer method data', type: BankTransferPaymentMethodData })
    bankTransfer?: BankTransferPaymentMethodData;

    @ApiPropertyOptional({ description: 'Refund method data', type: RefundPaymentMethodData })
    refund?: RefundPaymentMethodData;

    @ApiPropertyOptional({ description: 'Local transfer method data', type: LocalTransferPaymentMethodData })
    localTransfer?: LocalTransferPaymentMethodData;
}

export class PaymentTimelineData {
    @ApiPropertyOptional({ description: 'Timeline data code', enum: PaymentTimelineDataCode })
    code?: string;

    @ApiPropertyOptional({ description: 'Error message' })
    error?: string;

    @ApiPropertyOptional({ description: 'Balance log ID', type: String })
    balanceLog?: any;
}

export class PaymentTimeline {
    @ApiProperty({ description: 'Timeline action', enum: PaymentTimelineAction })
    action: string;

    @ApiPropertyOptional({ description: 'Timeline data', type: PaymentTimelineData })
    data?: PaymentTimelineData;

    @ApiProperty({ description: 'Payment status at this point', enum: PaymentStatus })
    status: PaymentStatus;

    @ApiProperty({ description: 'Timeline entry timestamp', type: Date })
    createdAt: Date;
}

export class Payment {
    @ApiProperty({ description: 'Payment amount', type: Number })
    amount: number;

    @ApiPropertyOptional({ description: 'Payment reference' })
    reference: string;

    @ApiProperty({ description: 'Payment currency', enum: TransactionCurrency })
    currency: TransactionCurrency;

    @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
    status: PaymentStatus;

    @ApiPropertyOptional({ description: 'Failure reason', enum: PaymentFailureReason })
    failureReason?: PaymentFailureReason;

    @ApiProperty({ description: 'Payment type', enum: PaymentType })
    type: PaymentType;

    @ApiProperty({ description: 'Account ID', type: String })
    account: any;

    @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
    method: PaymentMethod;

    @ApiPropertyOptional({ description: 'Payment method data', type: PaymentMethodData })
    methodData?: PaymentMethodData;

    @ApiProperty({ description: 'Total fees', type: Number, default: 0 })
    fees: number;

    @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
    metadata?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Payment timeline', type: [PaymentTimeline] })
    timeline?: PaymentTimeline[];

    @ApiProperty({ description: 'Payment creation date', type: Date })
    createdAt: Date;
}

export const ApiHydratedPayment = ApiHydrated(Payment);
