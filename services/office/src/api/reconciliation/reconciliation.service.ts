import { Repository, RepositoryFactory } from '@core/abstracts/repository';
import { TenantDataSource } from '@core/helpers';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { stringify } from 'csv-stringify/sync';
import { format } from 'date-fns';
import { AccountStatement, ReconciliationRun } from './reconciliation.schema';
import {
    ReconciliationStatus,
    StatementMatchStatus,
    StatementSourceRef,
    TransactionMode,
} from './reconciliation.enums';
import {
    parseProvidusStatement,
    extractNarration,
    isCardTransactionFormatOne,
    isCardTransactionFormatTwo,
    isFormatPayment,
    parseFormatCardTransactionOne,
    parseFormatCardTransactionTwo,
    parseFormatPayment,
    computeRowFingerprint,
    classifyTransactionClass,
    parseSingleStatementRow,
} from './reconciliation.utils';
import { CardAuthorization } from '@api/card-authorizations/card-authorization.schema';
import { MetricsQueryDto } from '@common/dtos';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { Payment } from '@api/payments/payment.schema';
import { ReservePayment } from '@api/reserve-payments/reserve-payments.schema';

/**
 * Parse a DD/MM/YYYY date string (Providus format) into a native Date at
 * midnight WAT (UTC+01:00). Returns undefined for missing or malformed values.
 */
function parseStatementDate(dateStr: string): Date | undefined {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return undefined;
    const [dd, mm, yyyy] = dateStr.split('/');
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00+01:00`);
}

/**
 * Extract the precise WAT timestamp encoded in a NIP session ID and validate
 * it against the statement's transactionDate (DD/MM/YYYY). Returns undefined
 * if the session date doesn't correspond or the ID is malformed.
 *
 * NIP session ID layout (30 chars): BBBBBB YY MM DD HH mm ss SSSSSSSSSSSS
 *   positions 6-7  = year (YY, e.g. "26" → 2026)
 *   positions 8-9  = month
 *   positions 10-11 = day
 *   positions 12-13 = hour
 *   positions 14-15 = minute
 *   positions 16-17 = second
 */
function parseSessionIdTimestamp(sessionId: string, transactionDate: string): Date | undefined {
    if (!sessionId || sessionId.length < 18 || !/^\d{12}/.test(sessionId.slice(6))) return undefined;

    const yy = sessionId.slice(6, 8);
    const mo = sessionId.slice(8, 10);
    const dd = sessionId.slice(10, 12);
    const hh = sessionId.slice(12, 14);
    const mi = sessionId.slice(14, 16);
    const ss = sessionId.slice(16, 18);

    // Only enrich when the session date matches the statement date (sanity guard)
    if (transactionDate) {
        const [stmtDd, stmtMo, stmtYyyy] = transactionDate.split('/');
        if (dd !== stmtDd || mo !== stmtMo || `20${yy}` !== stmtYyyy) return undefined;
    }

    const d = new Date(`20${yy}-${mo}-${dd}T${hh}:${mi}:${ss}+01:00`);
    return isNaN(d.getTime()) ? undefined : d;
}

@Injectable()
export class ReconciliationService {
    private readonly logger = new Logger(ReconciliationService.name);

    public statementRepo: Repository<AccountStatement>;
    public runRepo: Repository<ReconciliationRun>;

    constructor(
        @InjectModel(AccountStatement.name, TenantDataSource.Office)
        statementModel: Model<HydratedDocument<AccountStatement>>,
        @InjectModel(ReconciliationRun.name, TenantDataSource.Office)
        runModel: Model<HydratedDocument<ReconciliationRun>>,
        @InjectModel(CardAuthorization.name, TenantDataSource.Live)
        private cardAuthModel: Model<HydratedDocument<CardAuthorization>>,
        @InjectModel(Payment.name, TenantDataSource.Live)
        private paymentModel: Model<HydratedDocument<Payment>>,
        @InjectModel(ReservePayment.name, TenantDataSource.Live)
        private reservePaymentModel: Model<HydratedDocument<ReservePayment>>,
    ) {
        this.statementRepo = RepositoryFactory<AccountStatement>(statementModel, {
            searchFields: ['transactionDetails', 'source'],
            refs: ['source'],
        });
        this.runRepo = RepositoryFactory<ReconciliationRun>(runModel);
    }

    /**
     * Upload and parse a Providus bank statement CSV.
     * Strips headers, stores each transaction row as an AccountStatement document.
     * Idempotent: rows with duplicate fingerprints are skipped.
     */
    async uploadStatement(csvContent: string): Promise<HydratedDocument<ReconciliationRun>> {
        const { rows, metadata, parseErrors } = parseProvidusStatement(csvContent);

        this.logger.log(`Upload: parsed ${rows.length} rows, ${parseErrors.length} parse error(s)`);
        for (const e of parseErrors) {
            this.logger.warn(`Parse error at CSV line ${e.lineIndex}: ${e.error} | raw: ${e.raw.slice(0, 120)}`);
        }

        // Compute fingerprints and filter out rows that already exist
        const rowsWithFingerprints = rows.map((row) => ({
            ...row,
            fingerprint: computeRowFingerprint(row),
        }));

        const fingerprints = rowsWithFingerprints.map((r) => r.fingerprint);
        const existingStatements = await this.statementRepo.find({
            fingerprint: { $in: fingerprints },
        } as any);
        const existingFingerprints = new Set(existingStatements.map((s: any) => s.fingerprint));

        const newRows = rowsWithFingerprints.filter((r) => !existingFingerprints.has(r.fingerprint));

        this.logger.log(`Upload: ${newRows.length} new rows, ${rows.length - newRows.length} duplicate(s) skipped`);

        // Create reconciliation run
        const run = await this.runRepo.createAndSave({
            periodFrom: metadata.periodFrom,
            periodTo: metadata.periodTo,
            accountNumber: metadata.accountNumber,
            nubanNumber: metadata.nubanNumber,
            totalRows: rows.length,
            skippedRows: rows.length - newRows.length,
            status: ReconciliationStatus.Pending,
        } as any);

        // Bulk insert only new statement rows
        if (newRows.length > 0) {
            const statements = newRows.map((row) => ({
                transactionDate: row.transactionDate,
                actualTransactionDate: row.actualTransactionDate,
                transactionDetails: row.transactionDetails,
                valueDate: row.valueDate,
                debitAmount: row.debitAmount,
                creditAmount: row.creditAmount,
                currentBalance: row.currentBalance,
                mode: row.drCr === 'DR' ? TransactionMode.Debit : TransactionMode.Credit,
                docNum: row.docNum,
                fingerprint: row.fingerprint,
                transactionClass: classifyTransactionClass(row.transactionDetails),
                transactionDateAt: parseStatementDate(row.transactionDate),
                matchStatus: StatementMatchStatus.Unmatched,
                reconciliationRun: run._id,
            }));

            await this.statementRepo.bulkInsert(statements);
        }

        // Kick off reconciliation in the background — do not await
        setImmediate(() => {
            this.reconcile(run._id).catch((err) =>
                this.logger.error(`Background reconciliation failed for run ${run._id}: ${err.message}`),
            );
        });

        return run;
    }

    /**
     * Run the reconciliation matching process for a given run.
     * Iterates through all unmatched statements and attempts to match each to a
     * CardAuthorization or Payment.
     */
    async reconcile(runId: Types.ObjectId): Promise<HydratedDocument<ReconciliationRun>> {
        const run = await this.runRepo.findById(runId);

        // Guard against concurrent runs — bail if already processing
        if (run.status === ReconciliationStatus.Processing) {
            this.logger.warn(`Reconcile called on run ${run._id} that is already processing — skipping`);
            return run;
        }

        await this.runRepo.updateById(run._id, {
            status: ReconciliationStatus.Processing,
        } as any);

        const statements = await this.statementRepo.find({
            reconciliationRun: run._id,
            matchStatus: { $in: [StatementMatchStatus.Unmatched, StatementMatchStatus.Skipped] },
        });

        // Seed progress counters with already-matched rows so mid-run flushes reflect true totals
        let matched = run.matchedRows ?? 0;
        let unmatched = 0;
        let skipped = 0;

        const PROGRESS_FLUSH_INTERVAL = 100;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const status = await this.matchAndPersist(statement);
            if (status === StatementMatchStatus.Matched) matched++;
            else if (status === StatementMatchStatus.Unmatched) unmatched++;
            else skipped++;

            // Flush progress every N rows so the UI can poll for updates
            if ((i + 1) % PROGRESS_FLUSH_INTERVAL === 0) {
                await this.runRepo.updateById(run._id, {
                    matchedRows: matched,
                    unmatchedRows: unmatched,
                    skippedRows: skipped,
                } as any);
            }
        }

        // Recount all statuses from DB so final totals are always authoritative
        const statusCounts = await this.statementRepo.aggregate([
            { $match: { reconciliationRun: run._id } },
            { $group: { _id: '$matchStatus', n: { $sum: 1 } } },
        ]);
        const tally = Object.fromEntries(statusCounts.map((r: any) => [r._id, r.n]));

        const updatedRun = await this.runRepo.findOneAndUpdateById(run._id, {
            matchedRows: tally[StatementMatchStatus.Matched] ?? 0,
            unmatchedRows: tally[StatementMatchStatus.Unmatched] ?? 0,
            skippedRows: tally[StatementMatchStatus.Skipped] ?? 0,
            status: ReconciliationStatus.Completed,
        } as any);

        return updatedRun;
    }

    /**
     * Patch a faulty statement document by supplying the corrected raw CSV row.
     * Re-parses all fields (applying the triple-quote normalisation), recomputes
     * the fingerprint, then immediately attempts to match the corrected row.
     * Run counters are updated atomically if the match status changes.
     */
    async patchStatement(statementId: Types.ObjectId, rawCsvRow: string): Promise<HydratedDocument<AccountStatement>> {
        const statement = await this.statementRepo.findById(statementId);
        const previousStatus = statement.matchStatus as StatementMatchStatus;

        // Re-parse the corrected row using the same logic as upload
        const row = parseSingleStatementRow(rawCsvRow);
        const fingerprint = computeRowFingerprint(row);
        const transactionClass = classifyTransactionClass(row.transactionDetails);
        const mode = row.drCr === 'DR' ? TransactionMode.Debit : TransactionMode.Credit;

        // Overwrite all mutable fields so the document reflects the corrected data
        await this.statementRepo.updateById(statement._id, {
            transactionDate: row.transactionDate,
            actualTransactionDate: row.actualTransactionDate,
            transactionDetails: row.transactionDetails,
            valueDate: row.valueDate,
            debitAmount: row.debitAmount,
            creditAmount: row.creditAmount,
            currentBalance: row.currentBalance,
            mode,
            docNum: row.docNum,
            fingerprint,
            transactionClass,
            transactionDateAt: parseStatementDate(row.transactionDate),
            matchStatus: StatementMatchStatus.Unmatched,
            matchError: null,
            source: null,
            sourceRef: null,
        } as any);

        // Fetch the now-corrected document and attempt matching
        const corrected = await this.statementRepo.findById(statement._id);
        const newStatus = await this.matchAndPersist(corrected);

        if (newStatus === StatementMatchStatus.Matched) {
            // Update run counters: increment matched, decrement previous bucket
            const run = await this.runRepo.findById(statement.reconciliationRun as Types.ObjectId);
            const runPatch: any = { matchedRows: (run.matchedRows ?? 0) + 1 };
            if (previousStatus === StatementMatchStatus.Unmatched) {
                runPatch.unmatchedRows = Math.max(0, (run.unmatchedRows ?? 0) - 1);
            } else if (previousStatus === StatementMatchStatus.Skipped) {
                runPatch.skippedRows = Math.max(0, (run.skippedRows ?? 0) - 1);
            }
            await this.runRepo.updateById(run._id, runPatch);
        }

        return this.statementRepo.findById(statement._id);
    }

    async getStatementsCSV(query: APIPagingDto): Promise<[string, string]> {
        const { conditions, sort, populate } = MongoAPIPaging.getPagingConstraints(query, {});
        const select = [
            'transactionDate',
            'actualTransactionDate',
            'transactionDetails',
            'valueDate',
            'debitAmount',
            'creditAmount',
            'currentBalance',
            'mode',
            'docNum',
            'matchStatus',
            'transactionClass',
            'sourceRef',
        ];

        const results = await this.statementRepo.find(conditions, select, sort, populate);

        const data = results.map((s: any) => ({
            transactionDate: s.transactionDate ?? '',
            actualTransactionDate: s.actualTransactionDate ?? '',
            transactionDetails: s.transactionDetails ?? '',
            valueDate: s.valueDate ?? '',
            debitAmount: s.debitAmount ? s.debitAmount / 100 : '',
            creditAmount: s.creditAmount ? s.creditAmount / 100 : '',
            currentBalance: s.currentBalance != null ? s.currentBalance / 100 : '',
            mode: s.mode ?? '',
            docNum: s.docNum ?? '',
            matchStatus: s.matchStatus ?? '',
            transactionClass: s.transactionClass ?? '',
            sourceRef: s.sourceRef ?? '',
        }));

        const columns = [
            { key: 'transactionDate', header: 'Transaction Date' },
            { key: 'actualTransactionDate', header: 'Actual Transaction Date' },
            { key: 'transactionDetails', header: 'Transaction Details' },
            { key: 'valueDate', header: 'Value Date' },
            { key: 'debitAmount', header: 'Debit Amount' },
            { key: 'creditAmount', header: 'Credit Amount' },
            { key: 'currentBalance', header: 'Current Balance' },
            { key: 'mode', header: 'Mode' },
            { key: 'docNum', header: 'Doc Number' },
            { key: 'matchStatus', header: 'Match Status' },
            { key: 'transactionClass', header: 'Transaction Class' },
            { key: 'sourceRef', header: 'Source Ref' },
        ];

        const csv = stringify(data, { header: true, columns });
        const fileName = `hyphen-providus-statement-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        return [csv, fileName];
    }

    async getMetrics(query: MetricsQueryDto) {
        const prePipeline: any[] = [];

        if (query.from || query.to) {
            const dateMatch: Record<string, any> = {};
            if (query.from) dateMatch.$gte = new Date(query.from);
            if (query.to) dateMatch.$lte = new Date(query.to);
            prePipeline.push({ $match: { transactionDateAt: dateMatch } });
        }

        const [result] = await this.statementRepo.aggregate([
            ...prePipeline,
            {
                $facet: {
                    byMatchStatus: [{ $group: { _id: '$matchStatus', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
                    bySourceRef: [
                        { $match: { sourceRef: { $ne: null } } },
                        { $group: { _id: '$sourceRef', count: { $sum: 1 } } },
                        { $sort: { _id: 1 } },
                    ],
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalDebit: { $sum: '$debitAmount' },
                                totalCredit: { $sum: '$creditAmount' },
                                matchedDebit: {
                                    $sum: { $cond: [{ $eq: ['$matchStatus', 'matched'] }, '$debitAmount', 0] },
                                },
                                matchedCredit: {
                                    $sum: { $cond: [{ $eq: ['$matchStatus', 'matched'] }, '$creditAmount', 0] },
                                },
                                unmatchedDebit: {
                                    $sum: { $cond: [{ $eq: ['$matchStatus', 'unmatched'] }, '$debitAmount', 0] },
                                },
                                unmatchedCredit: {
                                    $sum: { $cond: [{ $eq: ['$matchStatus', 'unmatched'] }, '$creditAmount', 0] },
                                },
                            },
                        },
                        { $project: { _id: 0 } },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
            {
                $project: {
                    byMatchStatus: {
                        $arrayToObject: {
                            $map: { input: '$byMatchStatus', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    bySourceRef: {
                        $arrayToObject: {
                            $map: { input: '$bySourceRef', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    totals: { $ifNull: [{ $arrayElemAt: ['$totals', 0] }, {}] },
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byMatchStatus: {}, bySourceRef: {}, totals: {}, total: 0 };
    }

    /**
     * Match a single statement and persist the result.
     * Returns the final StatementMatchStatus so callers can update counters.
     */
    private async matchAndPersist(statement: HydratedDocument<AccountStatement>): Promise<StatementMatchStatus> {
        try {
            const result = await this.matchStatement(statement);
            if (result) {
                const refinedDateAt = result.sessionId
                    ? parseSessionIdTimestamp(result.sessionId, statement.transactionDate)
                    : undefined;
                await this.statementRepo.updateById(statement._id, {
                    source: result.sourceId,
                    sourceRef: result.sourceRef,
                    matchStatus: StatementMatchStatus.Matched,
                    matchError: null,
                    ...(refinedDateAt && { transactionDateAt: refinedDateAt }),
                } as any);
                return StatementMatchStatus.Matched;
            }

            const narration = extractNarration(statement.transactionDetails);
            const isMatchable =
                isCardTransactionFormatOne(narration) ||
                isCardTransactionFormatTwo(narration) ||
                isFormatPayment(narration);
            await this.statementRepo.updateById(statement._id, {
                matchStatus: StatementMatchStatus.Unmatched,
                matchError: isMatchable ? 'No matching source found' : 'Non-matchable transaction format',
            } as any);
            return StatementMatchStatus.Unmatched;
        } catch (error) {
            const errMsg = (error as Error).message ?? String(error);
            this.logger.warn(`Failed to match statement ${statement._id}: ${errMsg}`);
            await this.statementRepo.updateById(statement._id, {
                matchStatus: StatementMatchStatus.Skipped,
                matchError: errMsg,
            } as any);
            return StatementMatchStatus.Skipped;
        }
    }

    /**
     * Attempt to match a single statement row to a CardAuthorization or Payment.
     */
    private async matchStatement(
        statement: HydratedDocument<AccountStatement>,
    ): Promise<{ sourceId: Types.ObjectId; sourceRef: StatementSourceRef; sessionId?: string } | null> {
        const narration = extractNarration(statement.transactionDetails);

        // Determine amount — use debit if present, else credit
        const amountKobo = statement.debitAmount || statement.creditAmount;

        // Parse the transaction date for time-window queries
        const txnDate = this.parseStatementDate(statement.actualTransactionDate || statement.transactionDate);

        if (isCardTransactionFormatOne(narration)) {
            return this.matchCardFormatOne(narration, amountKobo, txnDate);
        }

        if (isCardTransactionFormatTwo(narration)) {
            return this.matchCardFormatTwo(narration, amountKobo, txnDate);
        }

        if (isFormatPayment(narration)) {
            return this.matchPayment(narration);
        }

        // No recognizable format — will be tracked as unmatched with reason
        return null;
    }

    private async matchCardFormatOne(
        narration: string,
        amountKobo: number,
        txnDate: Date | null,
    ): Promise<{ sourceId: Types.ObjectId; sourceRef: StatementSourceRef } | null> {
        const parsed = parseFormatCardTransactionOne(narration);

        const query: Record<string, any> = { type: 'capture' };

        if (parsed.terminalId) query['networkData.terminalId'] = parsed.terminalId;
        if (parsed.merchantId) query['networkData.merchantId'] = parsed.merchantId;
        if (parsed.stan) query['networkData.stan'] = parsed.stan;
        if (amountKobo > 0) query.amount = amountKobo;

        if (txnDate) {
            query.updatedAt = {
                $gte: new Date(txnDate.getTime() - 30 * 60 * 60 * 1000),
                $lte: new Date(txnDate.getTime() + 30 * 60 * 60 * 1000),
            };
        }

        const source = await this.cardAuthModel.findOne(query).exec();
        if (!source) return null;

        return { sourceId: source._id, sourceRef: StatementSourceRef.CardAuthorization };
    }

    private async matchCardFormatTwo(
        narration: string,
        amountKobo: number,
        txnDate: Date | null,
    ): Promise<{ sourceId: Types.ObjectId; sourceRef: StatementSourceRef } | null> {
        const parsed = parseFormatCardTransactionTwo(narration);

        const query: Record<string, any> = { type: 'capture' };

        if (parsed.terminalId) query['networkData.terminalId'] = parsed.terminalId;
        if (parsed.merchantId) query['networkData.merchantId'] = parsed.merchantId;
        if (parsed.rrn) query['networkData.rrn'] = parsed.rrn;
        if (parsed.stan) query['networkData.stan'] = parsed.stan;
        if (amountKobo > 0) query.amount = amountKobo;

        if (txnDate) {
            query.updatedAt = {
                $gte: new Date(txnDate.getTime() - 30 * 60 * 60 * 1000),
                $lte: new Date(txnDate.getTime() + 30 * 60 * 60 * 1000),
            };
        }

        const source = await this.cardAuthModel.findOne(query).exec();
        if (!source) return null;

        return { sourceId: source._id, sourceRef: StatementSourceRef.CardAuthorization };
    }

    private async matchPayment(
        narration: string,
    ): Promise<{ sourceId: Types.ObjectId; sourceRef: StatementSourceRef; sessionId: string } | null> {
        const parsed = parseFormatPayment(narration);

        // sessionId is globally unique per NIP transaction — no time window needed
        const payment = await this.paymentModel.findOne({ 'processorData.sessionId': parsed.sessionId }).exec();

        if (payment) {
            return { sourceId: payment._id, sourceRef: StatementSourceRef.Payment, sessionId: parsed.sessionId };
        }

        const reservePayment = await this.reservePaymentModel
            .findOne({ 'processorData.sessionId': parsed.sessionId })
            .exec();

        if (reservePayment) {
            return {
                sourceId: reservePayment._id,
                sourceRef: StatementSourceRef.ReservePayment,
                sessionId: parsed.sessionId,
            };
        }

        return null;
    }

    /**
     * Parse a statement date string (DD/MM/YYYY) to a Date object.
     */
    private parseStatementDate(dateStr: string): Date | null {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        const [day, month, year] = parts;
        const date = new Date(`${year}-${month}-${day}T00:00:00+0100`);
        return isNaN(date.getTime()) ? null : date;
    }
}
