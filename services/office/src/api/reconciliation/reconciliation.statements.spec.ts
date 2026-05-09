import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseProvidusStatement, classifyTransaction } from './reconciliation.utils';

const STATEMENTS_DIR = join(__dirname, '../../../statements');

describe('Real Statement CSVs', () => {
    const files = readdirSync(STATEMENTS_DIR).filter((f) => f.endsWith('.csv'));

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
        describe(`${file}`, () => {
            let csvContent: string;

            beforeAll(() => {
                csvContent = readFileSync(join(STATEMENTS_DIR, file), 'utf-8');
            });

            it('parses without throwing', () => {
                expect(() => parseProvidusStatement(csvContent)).not.toThrow();
            });

            it('extracts metadata (accountNumber, nubanNumber, periodFrom, periodTo)', () => {
                const { metadata } = parseProvidusStatement(csvContent);
                expect(metadata.accountNumber).toBeTruthy();
                expect(metadata.nubanNumber).toBeTruthy();
                expect(metadata.periodFrom).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
                expect(metadata.periodTo).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
            });

            it('returns at least one transaction row', () => {
                const { rows } = parseProvidusStatement(csvContent);
                expect(rows.length).toBeGreaterThan(0);
            });

            it('all rows have valid transactionDate (DD/MM/YYYY)', () => {
                const { rows } = parseProvidusStatement(csvContent);
                for (const row of rows) {
                    expect(row.transactionDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
                }
            });

            it('all rows have non-empty transactionDetails', () => {
                const { rows } = parseProvidusStatement(csvContent);
                for (const row of rows) {
                    expect(row.transactionDetails.length).toBeGreaterThan(0);
                }
            });

            it('all rows have numeric debit/credit/balance (no NaN)', () => {
                const { rows } = parseProvidusStatement(csvContent);
                for (const row of rows) {
                    expect(isNaN(row.debitAmount)).toBe(false);
                    expect(isNaN(row.creditAmount)).toBe(false);
                    expect(isNaN(row.currentBalance)).toBe(false);
                }
            });

            it('classifyTransaction does not throw on any row', () => {
                const { rows } = parseProvidusStatement(csvContent);
                for (const row of rows) {
                    expect(() => classifyTransaction(row.transactionDetails)).not.toThrow();
                }
            });

            it('logs classification breakdown', () => {
                const { rows } = parseProvidusStatement(csvContent);
                const counts = { card_format_one: 0, card_format_two: 0, payment: 0, unknown: 0 };
                for (const row of rows) {
                    const type = classifyTransaction(row.transactionDetails);
                    counts[type] = (counts[type] ?? 0) + 1;
                }
                console.log(`[${file}] ${rows.length} rows — ${JSON.stringify(counts)}`);
                expect(true).toBe(true);
            });
        });
    }
});
