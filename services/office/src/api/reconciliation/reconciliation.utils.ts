import { parse } from 'csv-parse/sync';
import { createHash } from 'crypto';
import { TransactionClass } from './reconciliation.enums';

/**
 * CSV header row columns in the Providus bank statement
 */
const HEADER_ROW_MARKER = 'Transaction Date';
const BALANCE_BF_MARKER = 'Balance B/F';

export interface CardTransactionFormatResult {
    terminalId: string;
    rrn: string;
    merchantId: string;
    stan: string;
}

export interface PaymentTransactionFormatResult {
    sessionId: string;
}

export interface ParsedStatementRow {
    transactionDate: string;
    actualTransactionDate: string;
    transactionDetails: string;
    valueDate: string;
    debitAmount: number;
    creditAmount: number;
    currentBalance: number;
    drCr: string;
    docNum: string;
}

export interface StatementMetadata {
    accountNumber: string;
    nubanNumber: string;
    periodFrom: string;
    periodTo: string;
}

export interface StatementParseError {
    lineIndex: number;
    raw: string;
    error: string;
}

/**
 * Parse a Providus bank statement CSV, stripping all header rows.
 * Returns structured rows, extracted metadata, and any per-line parse errors.
 */
export function parseProvidusStatement(csvContent: string): {
    rows: ParsedStatementRow[];
    metadata: StatementMetadata;
    parseErrors: StatementParseError[];
} {
    const metadata: StatementMetadata = {
        accountNumber: '',
        nubanNumber: '',
        periodFrom: '',
        periodTo: '',
    };

    const lines = csvContent.split('\n');

    // Extract metadata from header lines
    for (const line of lines) {
        if (line.startsWith('Account Number,')) {
            metadata.accountNumber = line.split(',')[1]?.trim() ?? '';
        }
        if (line.startsWith('NUBAN Number,')) {
            metadata.nubanNumber = line.split(',')[1]?.replace(/"/g, '').trim() ?? '';
        }
        if (line.includes('Statement of Account For  The Period From Date')) {
            const periodMatch = line.match(/From Date\s+(\d{2}\/\d{2}\/\d{4})\s+To Date\s+(\d{2}\/\d{2}\/\d{4})/);
            if (periodMatch) {
                metadata.periodFrom = periodMatch[1];
                metadata.periodTo = periodMatch[2];
            }
        }
    }

    // Find the header row index and parse from there
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(HEADER_ROW_MARKER)) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) {
        throw new Error('Could not find transaction header row in CSV');
    }

    // Skip the header line itself; delegate each data line to parseSingleStatementRow
    // which owns the triple-quote normalisation and column mapping.
    const dataLines = lines.slice(headerIndex + 1);

    const rows: ParsedStatementRow[] = [];
    const parseErrors: StatementParseError[] = [];

    // Match lines that start with a date: DD/MM/YYYY
    const DATE_LINE_RE = /^\d{2}\/\d{2}\/\d{4}/;

    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        if (!line.trim()) continue;

        // Footer/header/disclaimer lines — skip silently
        if (!DATE_LINE_RE.test(line.trim())) continue;

        try {
            const row = parseSingleStatementRow(line);
            if (row.transactionDetails === BALANCE_BF_MARKER) continue;
            rows.push(row);
        } catch (err) {
            parseErrors.push({
                lineIndex: headerIndex + 1 + i,
                raw: line,
                error: (err as Error).message ?? String(err),
            });
        }
    }

    return { rows, metadata, parseErrors };
}

/**
 * Parse a formatted amount string like "8,800.00" to kobo (integer cents).
 * Returns 0 for empty strings.
 */
export function parseAmount(value: string | undefined): number {
    if (!value || !value.trim()) return 0;
    const cleaned = value.replace(/[",\s]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
}

/**
 * Extract the narration part from transaction details.
 * Looks for "POS@" or "ATM@" prefix within the details string.
 */
export function extractNarration(transactionDetails: string): string {
    const posIndex = transactionDetails.indexOf('POS@');
    if (posIndex !== -1) {
        return transactionDetails.substring(posIndex);
    }

    const atmIndex = transactionDetails.indexOf('ATM@');
    if (atmIndex !== -1) {
        return transactionDetails.substring(atmIndex);
    }

    // For payment/transfer formats, return the full details
    return transactionDetails;
}

/**
 * Check if a narration is in Format One (angle bracket style).
 * Example: "POS@<3IPG0001> <IPG000000000001> <name> <ref/stan>"
 */
export function isCardTransactionFormatOne(narration: string): boolean {
    return (
        narration.length > 4 && (narration.startsWith('POS@') || narration.startsWith('ATM@')) && narration[4] === '<'
    );
}

/**
 * Check if a narration is in Format Two (slash-separated style).
 * Example: "POS@2UP1A787/796104/016092164515/2UP1KN000000030/name"
 */
export function isCardTransactionFormatTwo(narration: string): boolean {
    return (
        narration.length > 4 &&
        (narration.startsWith('POS@') || narration.startsWith('ATM@')) &&
        narration[4] !== '<' &&
        narration.substring(4).length > 0
    );
}

/**
 * Check if a narration is a payment/transfer format.
 * Matches VPS TRANSFERS / inbound payment patterns containing a session ID.
 */
export function isFormatPayment(narration: string): boolean {
    return narration.includes('/') && !narration.startsWith('POS@') && !narration.startsWith('ATM@');
}

/**
 * Parse Format One (angle bracket) narration.
 * Input: "POS@<terminalID> <merchantID> <name> <stan_ref/stan>"
 */
export function parseFormatCardTransactionOne(narration: string): CardTransactionFormatResult {
    narration = narration.trim();

    if (!isCardTransactionFormatOne(narration)) {
        throw new Error(`Narration is not in Format One: ${narration}`);
    }

    // Remove "POS@" or "ATM@" prefix and surrounding angle brackets
    let parts = narration.substring(4);
    parts = parts.substring(1, parts.length - 1);

    // Split by "> <"
    const segments = parts.split('> <');

    if (segments.length < 4) {
        throw new Error('Insufficient parts in format one narration');
    }

    const terminalId = segments[0];
    const merchantId = segments[1];

    // Extract STAN from reference info (last segment): "857468/000998"
    let stan = '';
    const referenceInfo = segments[segments.length - 1];
    const stanParts = referenceInfo.split('/');
    if (stanParts.length > 1) {
        stan = stanParts[1];
    }

    return { terminalId, merchantId, rrn: '', stan };
}

/**
 * Parse Format Two (slash-separated) narration.
 * Input: "POS@terminalID/stan/rrn/merchantID/name"
 */
export function parseFormatCardTransactionTwo(narration: string): CardTransactionFormatResult {
    narration = narration.trim();

    if (!isCardTransactionFormatTwo(narration)) {
        throw new Error(`Narration is not in Format Two: ${narration}`);
    }

    // Remove "POS@" or "ATM@" prefix
    const parts = narration.substring(4);

    // Split by "/"
    const segments = parts.split('/');

    if (segments.length < 5) {
        throw new Error('Insufficient parts in format two narration');
    }

    const terminalId = segments[0];
    const stan = segments[1];
    const rrn = segments[2];
    const merchantId = segments[3];

    return { terminalId, merchantId, rrn, stan };
}

/**
 * Parse a payment/transfer narration to extract the session ID (last segment after /).
 */
export function parseFormatPayment(narration: string): PaymentTransactionFormatResult {
    narration = narration.trim();

    if (!narration.includes('/')) {
        throw new Error(`Narration is not a payment format: ${narration}`);
    }

    const parts = narration.split('/');
    const sessionId = parts[parts.length - 1].trim();

    return { sessionId };
}

/**
 * Determine narration type from full transaction details.
 * Returns 'card-format-one' | 'card-format-two' | 'payment' | 'unknown'
 */
export function classifyTransaction(
    transactionDetails: string,
): 'card-format-one' | 'card-format-two' | 'payment' | 'unknown' {
    const narration = extractNarration(transactionDetails);

    if (isCardTransactionFormatOne(narration)) return 'card-format-one';
    if (isCardTransactionFormatTwo(narration)) return 'card-format-two';
    if (isFormatPayment(narration)) return 'payment';
    return 'unknown';
}

/**
 * Session ID pattern: NIP session IDs are 17+ consecutive digits embedded in the narration.
 */
const SESSION_ID_PATTERN = /\d{17,}/;

/**
 * Classify a transaction into a high-level TransactionClass.
 * Unlike classifyTransaction (which identifies the card format for matching),
 * this function categorises every row type including fees and transfers.
 */
export function classifyTransactionClass(transactionDetails: string): TransactionClass {
    const d = transactionDetails.trim().toUpperCase();

    // ── Fees & charges (check before slash-based patterns) ──────────────────
    if (d.startsWith('STAMP DUTY')) return TransactionClass.StampDuty;
    if (d.startsWith('VAT ') || d === 'VAT') return TransactionClass.Vat;
    if (d.startsWith('COMMISSION ') || d === 'COMMISSION') return TransactionClass.Commission;
    if (d.startsWith('SMS CHARGE') || d.includes('SMS ALERT CHARGE')) return TransactionClass.SmsCharge;
    if (d.startsWith('ACCOUNT MAINTENANCE')) return TransactionClass.AccountMaintenanceFee;
    if (d.startsWith('BANK CHARGES')) return TransactionClass.BankCharge;
    if (d.startsWith('REF. LETTER CHARGE')) return TransactionClass.LegalFee;
    if (d.startsWith('LEGAL SEARCH')) return TransactionClass.LegalFee;
    if (d.startsWith('CARDS TRANSACTIONS')) return TransactionClass.CardSchemeFee;
    if (d.startsWith('SETTLEMENT TRANSACTIONS') || d.startsWith('CASHCARD SETTLEMENT'))
        return TransactionClass.Settlement;
    if (d.startsWith('REVERSAL')) return TransactionClass.Reversal;
    if (d.startsWith('LOYALTY REWARD')) return TransactionClass.LoyaltyReward;

    // ── Card transactions ────────────────────────────────────────────────────
    const narration = extractNarration(transactionDetails);
    if (isCardTransactionFormatOne(narration) || isCardTransactionFormatTwo(narration)) {
        return TransactionClass.Card;
    }
    if (d.startsWith('3RD PARTY CARD TRANSACTION') || d.startsWith('POINT OF SALE PURCHASE TRANSACTION')) {
        return TransactionClass.Card;
    }

    // ── Payment vs Transfer ──────────────────────────────────────────────────
    // VPS / NIP transfers: distinguish by presence of a long session ID number
    if (
        d.startsWith('VPS TRANSFERS') ||
        d.startsWith('INWARD TRANSFER') ||
        d.startsWith('OUTWARD TRANSFER') ||
        d.startsWith('PAYMENTS')
    ) {
        return SESSION_ID_PATTERN.test(transactionDetails) ? TransactionClass.Payment : TransactionClass.Transfer;
    }

    if (d.startsWith('ACCOUNT TRANSFERS') || d.startsWith('TRANSFER BETWEEN')) {
        return TransactionClass.Transfer;
    }

    // Generic slash-based payment (session ID in path)
    if (isFormatPayment(transactionDetails)) return TransactionClass.Payment;

    return TransactionClass.Unknown;
}

/**
 * Compute a SHA-256 fingerprint for a parsed statement row.
 * Uses transactionDate + transactionDetails + debitAmount + creditAmount + currentBalance
 * to uniquely identify a row across uploads.
 */
export function computeRowFingerprint(row: ParsedStatementRow): string {
    const input = [
        row.transactionDate,
        row.transactionDetails,
        row.debitAmount.toString(),
        row.creditAmount.toString(),
        row.currentBalance.toString(),
    ].join('|');
    return createHash('sha256').update(input).digest('hex');
}

/**
 * Parse a single raw CSV data line (no header) from a Providus bank statement.
 * Applies the same triple-quote normalisation as parseProvidusStatement so
 * corrected rows submitted via the patch endpoint are handled identically.
 *
 * Example input:
 *   03/05/2025,03/05/2025,"POINT OF SALE PURCHASE TRANSACTION   POS@<22148F55> <2214LA877589020> <CENTEPA LIMITED (OPERAT"""41, ST FINXXNG> <400339/941895>",03/05/2025,"13,150.00",,"5,811,462.05",,9999941895
 */
export function parseSingleStatementRow(rawCsvRow: string): ParsedStatementRow {
    // Normalise triple-quotes (same fix as in parseProvidusStatement)
    const normalised = rawCsvRow.replace(/"{3,}/g, '""');

    // Prepend a dummy header row so csv-parse knows to treat each line as a record
    const csvWithHeader = `h0,h1,h2,h3,h4,h5,h6,h7,h8\n${normalised}`;

    const records: string[][] = parse(csvWithHeader, {
        relax_column_count: true,
        relax_quotes: true,
        skip_empty_lines: true,
    });

    if (records.length < 2) {
        throw new Error('Could not parse CSV row: no data record found after header');
    }

    const row = records[1]; // records[0] is the dummy header
    const transactionDetails = (row[2] ?? '').trim();

    if (!transactionDetails) {
        throw new Error('Parsed CSV row has no transaction details (column 3 is empty)');
    }

    return {
        transactionDate: (row[0] ?? '').trim(),
        actualTransactionDate: (row[1] ?? '').trim(),
        transactionDetails,
        valueDate: (row[3] ?? '').trim(),
        debitAmount: parseAmount(row[4]),
        creditAmount: parseAmount(row[5]),
        currentBalance: parseAmount(row[6]),
        drCr: (row[7] ?? '').trim(),
        docNum: (row[8] ?? '').trim(),
    };
}
