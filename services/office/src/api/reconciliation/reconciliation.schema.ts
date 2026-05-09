import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';
import {
    ReconciliationStatus,
    StatementMatchStatus,
    StatementSourceRef,
    TransactionClass,
    TransactionMode,
} from './reconciliation.enums';

@Schema(
    ModelSchemaOptions({
        tag: ModelIdTag.AccountStatement,
        objectIds: ['source:#sourceRef'],
        pick: '-rawData -sourceRef',
    }),
)
export class AccountStatement {
    @Prop({ required: true })
    @ApiProperty({ description: 'Transaction date from bank statement (DD/MM/YYYY display string)' })
    transactionDate: string;

    @Prop({ type: Date })
    @ApiPropertyOptional({ description: 'Transaction date as a native Date (WAT) for sorting and range queries' })
    transactionDateAt?: Date;

    @Prop()
    @ApiPropertyOptional({ description: 'Actual transaction date' })
    actualTransactionDate: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Transaction details / narration' })
    transactionDetails: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Value date' })
    valueDate: string;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Debit amount in kobo', type: Number })
    debitAmount: number;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Credit amount in kobo', type: Number })
    creditAmount: number;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Current balance in kobo', type: Number })
    currentBalance: number;

    @Prop({ type: String, enum: Utils.enumToArray(TransactionMode) })
    @ApiPropertyOptional({ description: 'Transaction mode (debit or credit)', enum: TransactionMode })
    mode: TransactionMode;

    @Prop()
    @ApiPropertyOptional({ description: 'Document number from bank' })
    docNum: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(StatementMatchStatus),
        default: StatementMatchStatus.Unmatched,
    })
    @ApiProperty({ description: 'Match status', enum: StatementMatchStatus })
    matchStatus: StatementMatchStatus;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'sourceRef',
    })
    @ApiPropertyOptional({ description: 'Matched source document ID', type: String })
    source?: any;

    @Prop({ type: String, enum: Utils.enumToArray(StatementSourceRef) })
    sourceRef?: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Reason the statement could not be matched' })
    matchError?: string;

    @Prop({ type: String, enum: Utils.enumToArray(TransactionClass), default: TransactionClass.Unknown })
    @ApiPropertyOptional({ description: 'High-level transaction classification', enum: TransactionClass })
    transactionClass: TransactionClass;

    @Prop({ unique: true, required: true })
    @ApiProperty({ description: 'SHA-256 fingerprint of the transaction row for deduplication' })
    fingerprint: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ReconciliationRun' })
    @ApiProperty({ description: 'Reconciliation run ID', type: String })
    reconciliationRun: any;
}

export const AccountStatementSchema = SchemaFactory.createForClass(AccountStatement);
AccountStatementSchema.index({ transactionDateAt: 1 });
AccountStatementSchema.index({ source: 1 });
AccountStatementSchema.index({ transactionClass: 1 });
AccountStatementSchema.index({ matchStatus: 1 });
AccountStatementSchema.index({ mode: 1 });

export const ApiHydratedAccountStatement = ApiHydrated(AccountStatement);

@Schema(ModelSchemaOptions({ tag: ModelIdTag.ReconciliationRun }))
export class ReconciliationRun {
    @Prop({ required: true })
    @ApiProperty({ description: 'Statement period start date' })
    periodFrom: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Statement period end date' })
    periodTo: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Account number from statement' })
    accountNumber: string;

    @Prop()
    @ApiPropertyOptional({ description: 'NUBAN number from statement' })
    nubanNumber: string;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Total rows imported', type: Number })
    totalRows: number;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Matched rows count', type: Number })
    matchedRows: number;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Unmatched rows count', type: Number })
    unmatchedRows: number;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Skipped rows count', type: Number })
    skippedRows: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(ReconciliationStatus),
        default: ReconciliationStatus.Pending,
    })
    @ApiProperty({ description: 'Reconciliation run status', enum: ReconciliationStatus })
    status: ReconciliationStatus;
}

export const ReconciliationRunSchema = SchemaFactory.createForClass(ReconciliationRun);
export const ApiHydratedReconciliationRun = ApiHydrated(ReconciliationRun);
