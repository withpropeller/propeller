import {
    parseAmount,
    extractNarration,
    isCardTransactionFormatOne,
    isCardTransactionFormatTwo,
    isFormatPayment,
    parseFormatCardTransactionOne,
    parseFormatCardTransactionTwo,
    parseFormatPayment,
    parseProvidusStatement,
    classifyTransaction,
    computeRowFingerprint,
    classifyTransactionClass,
    ParsedStatementRow,
} from './reconciliation.utils';
import { TransactionClass } from './reconciliation.enums';

describe('ReconciliationUtils', () => {
    describe('parseAmount', () => {
        it('should parse a formatted amount to kobo', () => {
            expect(parseAmount('8,800.00')).toBe(880000);
        });

        it('should parse a large amount with commas', () => {
            expect(parseAmount('35,726,494.09')).toBe(3572649409);
        });

        it('should parse an amount with quotes', () => {
            expect(parseAmount('"209,850.00"')).toBe(20985000);
        });

        it('should return 0 for empty string', () => {
            expect(parseAmount('')).toBe(0);
        });

        it('should return 0 for undefined', () => {
            expect(parseAmount(undefined)).toBe(0);
        });

        it('should handle amounts without commas', () => {
            expect(parseAmount('10.00')).toBe(1000);
        });

        it('should handle whole number amounts', () => {
            expect(parseAmount('200.00')).toBe(20000);
        });
    });

    describe('extractNarration', () => {
        it('should extract narration starting with POS@', () => {
            const details =
                'POINT OF SALE PURCHASE TRANSACTION   POS@<3IPG0001> <IPG000000000001> <133781918593           www.interswitLANG> <265919220851> <654179/220851>';
            expect(extractNarration(details)).toBe(
                'POS@<3IPG0001> <IPG000000000001> <133781918593           www.interswitLANG> <265919220851> <654179/220851>',
            );
        });

        it('should extract narration starting with POS@ for format two', () => {
            const details =
                '3RD PARTY CARD TRANSACTION   POS@257Z015G/021646/7Z015G021643/257ZLA200002037/PANAHA LIMITED         20 ELSIE FEMILANG';
            expect(extractNarration(details)).toBe(
                'POS@257Z015G/021646/7Z015G021643/257ZLA200002037/PANAHA LIMITED         20 ELSIE FEMILANG',
            );
        });

        it('should return full details for payment format (no POS@/ATM@)', () => {
            const details =
                'VPS TRANSFERS   FROM FLUTTERWAVE / WISE PAYMENTS LIMITED-From WISE PAYMENTS LIMITED/110002260411024030000174432457';
            expect(extractNarration(details)).toBe(details);
        });

        it('should extract narration with ATM@ prefix', () => {
            const details = 'ATM WITHDRAWAL   ATM@<TERM1> <MERCH1> <NAME> <REF/STAN>';
            expect(extractNarration(details)).toBe('ATM@<TERM1> <MERCH1> <NAME> <REF/STAN>');
        });
    });

    describe('isCardTransactionFormatOne', () => {
        it('should return true for angle bracket format', () => {
            expect(isCardTransactionFormatOne('POS@<3IPG0001> <IPG000000000001> <name> <654179/220851>')).toBe(true);
        });

        it('should return false for slash format', () => {
            expect(isCardTransactionFormatOne('POS@257Z015G/021646/7Z015G021643/257ZLA200002037/name')).toBe(false);
        });

        it('should return false for short string', () => {
            expect(isCardTransactionFormatOne('POS')).toBe(false);
        });

        it('should return true for ATM@ with angle brackets', () => {
            expect(isCardTransactionFormatOne('ATM@<TERM1> <MERCH1> <NAME> <REF/STAN>')).toBe(true);
        });
    });

    describe('isCardTransactionFormatTwo', () => {
        it('should return true for slash format', () => {
            expect(isCardTransactionFormatTwo('POS@257Z015G/021646/7Z015G021643/257ZLA200002037/name')).toBe(true);
        });

        it('should return false for angle bracket format', () => {
            expect(isCardTransactionFormatTwo('POS@<3IPG0001> <IPG000000000001> <name> <654179/220851>')).toBe(false);
        });

        it('should return false for short string', () => {
            expect(isCardTransactionFormatTwo('POS')).toBe(false);
        });
    });

    describe('isFormatPayment', () => {
        it('should return true for payment narration with slashes', () => {
            expect(
                isFormatPayment(
                    'VPS TRANSFERS   FROM FLUTTERWAVE / WISE PAYMENTS LIMITED-From WISE PAYMENTS LIMITED/110002260411024030000174432457',
                ),
            ).toBe(true);
        });

        it('should return false for POS@ narrations', () => {
            expect(isFormatPayment('POS@257Z015G/021646/foo/bar/baz')).toBe(false);
        });

        it('should return false for narration without slashes', () => {
            expect(isFormatPayment('some random text')).toBe(false);
        });
    });

    describe('parseFormatCardTransactionOne', () => {
        it('should parse a format one narration with 5 segments', () => {
            const narration =
                'POS@<3IPG0001> <IPG000000000001> <133781918593           www.interswitLANG> <265919220851> <654179/220851>';
            const result = parseFormatCardTransactionOne(narration);
            expect(result.terminalId).toBe('3IPG0001');
            expect(result.merchantId).toBe('IPG000000000001');
            expect(result.stan).toBe('220851');
            expect(result.rrn).toBe('');
        });

        it('should parse a BILL PAYMENT narration with POS@ format one', () => {
            const narration =
                'POS@<2ISMG1BO> <2TEPLA000000002> <T M E N U FB LIMITE 000110 2ISMG1BO LANG> <000000000110> <655868/000110>';
            const result = parseFormatCardTransactionOne(narration);
            expect(result.terminalId).toBe('2ISMG1BO');
            expect(result.merchantId).toBe('2TEPLA000000002');
            expect(result.stan).toBe('000110');
        });

        it('should throw for non-format-one narration', () => {
            expect(() =>
                parseFormatCardTransactionOne('POS@257Z015G/021646/7Z015G021643/257ZLA200002037/name'),
            ).toThrow('Narration is not in Format One');
        });

        it('should throw for insufficient segments', () => {
            expect(() => parseFormatCardTransactionOne('POS@<A> <B> <C>')).toThrow('Insufficient parts');
        });
    });

    describe('parseFormatCardTransactionTwo', () => {
        it('should parse a format two narration', () => {
            const narration =
                'POS@257Z015G/021646/7Z015G021643/257ZLA200002037/PANAHA LIMITED         20 ELSIE FEMILANG';
            const result = parseFormatCardTransactionTwo(narration);
            expect(result.terminalId).toBe('257Z015G');
            expect(result.stan).toBe('021646');
            expect(result.rrn).toBe('7Z015G021643');
            expect(result.merchantId).toBe('257ZLA200002037');
        });

        it('should parse Netflix 3rd party card transaction', () => {
            const narration =
                'POS@ECONGA59/212886/007559895208/566700000602830/Netflixcom             LAGOS          NG';
            const result = parseFormatCardTransactionTwo(narration);
            expect(result.terminalId).toBe('ECONGA59');
            expect(result.stan).toBe('212886');
            expect(result.rrn).toBe('007559895208');
            expect(result.merchantId).toBe('566700000602830');
        });

        it('should throw for non-format-two narration', () => {
            expect(() =>
                parseFormatCardTransactionTwo('POS@<3IPG0001> <IPG000000000001> <name> <654179/220851>'),
            ).toThrow('Narration is not in Format Two');
        });

        it('should throw for insufficient segments', () => {
            expect(() => parseFormatCardTransactionTwo('POS@A/B/C')).toThrow('Insufficient parts');
        });
    });

    describe('parseFormatPayment', () => {
        it('should extract session ID from a VPS TRANSFERS narration', () => {
            const narration =
                'VPS TRANSFERS   FROM FLUTTERWAVE / WISE PAYMENTS LIMITED-From WISE PAYMENTS LIMITED/110002260411024030000174432457';
            const result = parseFormatPayment(narration);
            expect(result.sessionId).toBe('110002260411024030000174432457');
        });

        it('should extract session ID from a VPS TRANSFERS narration', () => {
            const narration =
                'VPS TRANSFERS FROM STERLING/ DAVIDHOOD MEDIA-BANCA Transfer from DAVIDHOOD MEDIA to SEID-ALW for Refund/000001260416205616427921223960';
            const result = parseFormatPayment(narration);
            expect(result.sessionId).toBe('000001260416205616427921223960');
        });

        it('should extract session ID from NIP transfer narration', () => {
            const narration =
                'VPS TRANSFERS   FROM GTBANK/ AMURE OLANREWAJU IBRAHIM-NIP Transfer to Ibrahim Amure /000013260411044733000104287872';
            const result = parseFormatPayment(narration);
            expect(result.sessionId).toBe('000013260411044733000104287872');
        });

        it('should extract session ID from a credit narration', () => {
            const narration =
                'VPS TRANSFERS   TRANSFER FROM STROWALLET DIGITAL SERV. LTD. 54*****55 TO Strollwallet Digital-ALW 96*****28 /202260410027397100002';
            const result = parseFormatPayment(narration);
            expect(result.sessionId).toBe('202260410027397100002');
        });

        it('should throw for narration without slashes', () => {
            expect(() => parseFormatPayment('some plain text')).toThrow('Narration is not a payment format');
        });
    });

    describe('classifyTransaction', () => {
        it('should classify POS format one transactions', () => {
            expect(
                classifyTransaction(
                    'POINT OF SALE PURCHASE TRANSACTION   POS@<3IPG0001> <IPG000000000001> <name> <654179/220851>',
                ),
            ).toBe('card-format-one');
        });

        it('should classify POS format two transactions', () => {
            expect(
                classifyTransaction(
                    '3RD PARTY CARD TRANSACTION   POS@257Z015G/021646/7Z015G021643/257ZLA200002037/name',
                ),
            ).toBe('card-format-two');
        });

        it('should classify VPS transfer as payment', () => {
            expect(
                classifyTransaction(
                    'VPS TRANSFERS   FROM FLUTTERWAVE / WISE PAYMENTS LIMITED-From WISE PAYMENTS LIMITED/110002260411024030000174432457',
                ),
            ).toBe('payment');
        });

        it('should classify BILL PAYMENT with POS@ format one', () => {
            expect(
                classifyTransaction(
                    'BILL PAYMENT - FUNDS TRANSFER 9999000110 9999 POS@<2ISMG1BO> <2TEPLA000000002> <T M E N U FB LIMITE 000110 2ISMG1BO LANG> <000000000110> <655868/000110>',
                ),
            ).toBe('card-format-one');
        });

        it('should return unknown for unrecognized formats', () => {
            expect(classifyTransaction('SOME RANDOM NARRATION WITHOUT PATTERN')).toBe('unknown');
        });
    });

    describe('parseProvidusStatement', () => {
        const sampleCSV = `PROVIDUS BANK
0202,HEAD OFFICE BRANCH
,,,,

Customer Name,ALLAWEE TECHNOLOGIES LTD
Account Number,0202/0161624/001/0054/000
NUBAN Number,"5401345914"
Account Type,PROVIDUSBANK PREMIUM PLUS-CORP CURR.ACCT - NAIRA
Account Nickname,ALLAWEE TECHNOLOGIES LTD
Statement of Account For  The Period From Date 11/04/2026 To Date 12/04/2026

,Transaction Description,All,Transaction Type,All
,Number of Debit Transaction(s),344,Number of Credit Transaction(s),41
,Total Debit Amount,"35,726,494.09",Total Credit Amount,"46,239,889.30"
,Period Opening Balance ,"8,810,189.57",Period Closing Balance ,"19,323,584.78"


Transaction Date,Actual Transaction Date,Transaction Details,Value Date,Debit Amount,Credit Amount,Current Balance,DR/CR,DOC-NUM
09/04/2026,,Balance B/F,,,,"8,810,189.57",,
10/04/2026,11/04/2026,"VPS TRANSFERS   TRANSFER FROM STROWALLET DIGITAL SERV. LTD. 54*****55 TO Strollwallet Digital-ALW 96*****28 /202260410027397100002",10/04/2026,,"209,850.00","9,020,039.57",,0
10/04/2026,11/04/2026,"POINT OF SALE PURCHASE TRANSACTION   POS@<3IPG0001> <IPG000000000001> <133781918593           www.interswitLANG> <265919220851> <654179/220851>",10/04/2026,"8,800.00",,"9,011,239.57",,9999220851
11/04/2026,11/04/2026,"3RD PARTY CARD TRANSACTION   POS@257Z015G/021646/7Z015G021643/257ZLA200002037/PANAHA LIMITED         20 ELSIE FEMILANG",10/04/2026,"3,000.00",,"8,908,677.07",,0`;

        it('should extract metadata from the statement', () => {
            const { metadata } = parseProvidusStatement(sampleCSV);
            expect(metadata.accountNumber).toBe('0202/0161624/001/0054/000');
            expect(metadata.nubanNumber).toBe('5401345914');
            expect(metadata.periodFrom).toBe('11/04/2026');
            expect(metadata.periodTo).toBe('12/04/2026');
        });

        it('should skip Balance B/F rows', () => {
            const { rows } = parseProvidusStatement(sampleCSV);
            const bfRows = rows.filter((r) => r.transactionDetails === 'Balance B/F');
            expect(bfRows).toHaveLength(0);
        });

        it('should parse all transaction rows', () => {
            const { rows } = parseProvidusStatement(sampleCSV);
            expect(rows).toHaveLength(3);
        });

        it('should correctly parse a credit row', () => {
            const { rows } = parseProvidusStatement(sampleCSV);
            const creditRow = rows[0];
            expect(creditRow.transactionDate).toBe('10/04/2026');
            expect(creditRow.creditAmount).toBe(20985000); // 209,850.00 in kobo
            expect(creditRow.debitAmount).toBe(0);
            expect(creditRow.docNum).toBe('0');
        });

        it('should correctly parse a debit row', () => {
            const { rows } = parseProvidusStatement(sampleCSV);
            const debitRow = rows[1];
            expect(debitRow.transactionDate).toBe('10/04/2026');
            expect(debitRow.debitAmount).toBe(880000); // 8,800.00 in kobo
            expect(debitRow.creditAmount).toBe(0);
            expect(debitRow.docNum).toBe('9999220851');
        });

        it('should correctly parse the current balance', () => {
            const { rows } = parseProvidusStatement(sampleCSV);
            expect(rows[0].currentBalance).toBe(902003957); // 9,020,039.57 in kobo
        });

        it('should throw if header row is missing', () => {
            const badCSV = 'PROVIDUS BANK\nSome random data\n';
            expect(() => parseProvidusStatement(badCSV)).toThrow('Could not find transaction header row');
        });
    });

    describe('computeRowFingerprint', () => {
        const baseRow: ParsedStatementRow = {
            transactionDate: '10/04/2026',
            actualTransactionDate: '11/04/2026',
            transactionDetails: 'POS@<3IPG0001> <IPG000000000001> <name> <654179/220851>',
            valueDate: '10/04/2026',
            debitAmount: 880000,
            creditAmount: 0,
            currentBalance: 901123957,
            drCr: '',
            docNum: '9999220851',
        };

        it('should return a 64-char hex string', () => {
            const fp = computeRowFingerprint(baseRow);
            expect(fp).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should return the same fingerprint for identical rows', () => {
            const fp1 = computeRowFingerprint(baseRow);
            const fp2 = computeRowFingerprint({ ...baseRow });
            expect(fp1).toBe(fp2);
        });

        it('should return different fingerprints when transactionDetails differ', () => {
            const fp1 = computeRowFingerprint(baseRow);
            const fp2 = computeRowFingerprint({ ...baseRow, transactionDetails: 'different narration' });
            expect(fp1).not.toBe(fp2);
        });

        it('should return different fingerprints when amount differs', () => {
            const fp1 = computeRowFingerprint(baseRow);
            const fp2 = computeRowFingerprint({ ...baseRow, debitAmount: 990000 });
            expect(fp1).not.toBe(fp2);
        });

        it('should return different fingerprints when currentBalance differs', () => {
            const fp1 = computeRowFingerprint(baseRow);
            const fp2 = computeRowFingerprint({ ...baseRow, currentBalance: 123456 });
            expect(fp1).not.toBe(fp2);
        });

        it('should return different fingerprints when transactionDate differs', () => {
            const fp1 = computeRowFingerprint(baseRow);
            const fp2 = computeRowFingerprint({ ...baseRow, transactionDate: '11/04/2026' });
            expect(fp1).not.toBe(fp2);
        });

        it('should not be affected by fields outside the fingerprint (docNum, drCr, valueDate)', () => {
            const fp1 = computeRowFingerprint(baseRow);
            const fp2 = computeRowFingerprint({ ...baseRow, docNum: 'DIFFERENT', drCr: 'CR', valueDate: '12/04/2026' });
            expect(fp1).toBe(fp2);
        });
    });

    describe('classifyTransactionClass', () => {
        it('should classify POS format-one as card', () => {
            expect(
                classifyTransactionClass(
                    'POINT OF SALE PURCHASE TRANSACTION   POS@<3IPG0001> <IPG000000000001> <Shop> <654179/220851>',
                ),
            ).toBe(TransactionClass.Card);
        });

        it('should classify POS format-two as card', () => {
            expect(
                classifyTransactionClass(
                    '3RD PARTY CARD TRANSACTION   POS@257Z015G/021646/7Z015G021643/257ZLA200002037/MERCHANT LANG',
                ),
            ).toBe(TransactionClass.Card);
        });

        it('should classify VPS TRANSFER with session ID as payment', () => {
            expect(
                classifyTransactionClass(
                    'VPS TRANSFERS   FROM GTBANK/ OWUYE OLUWATOBI- REF403479017000025000002301010934/000013230101093422000675794798',
                ),
            ).toBe(TransactionClass.Payment);
        });

        it('should classify VPS TRANSFER without session ID as transfer', () => {
            expect(
                classifyTransactionClass(
                    'VPS TRANSFERS   ONLINE TRF FROM TOPSHIP LIMITED TO ALLAWEE(TOPSHIP LIMITED) ALLAWEE WALLET TOP UP',
                ),
            ).toBe(TransactionClass.Transfer);
        });

        it('should classify OUTWARD TRANSFER with session ID as payment', () => {
            expect(classifyTransactionClass('OUTWARD TRANSFER (N) 209969  Xmas/000023230101134707005043737740')).toBe(
                TransactionClass.Payment,
            );
        });

        it('should classify OUTWARD TRANSFER without session ID as transfer', () => {
            expect(
                classifyTransactionClass(
                    'OUTWARD TRANSFER (N) 3133176  Ali dauda opay 8068776001 1900 Ilupeju-yaba Customer paid 3600',
                ),
            ).toBe(TransactionClass.Transfer);
        });

        it('should classify STAMP DUTY CHARGE as stamp_duty', () => {
            expect(
                classifyTransactionClass(
                    'STAMP DUTY CHARGE 22506993 29 FROM PAYSTACK/110006220811104514016443754401FROM CENTER BRANCH',
                ),
            ).toBe(TransactionClass.StampDuty);
        });

        it('should classify VAT charge as vat', () => {
            expect(classifyTransactionClass('VAT 209969  Xmas/000023230101134707005043737740')).toBe(
                TransactionClass.Vat,
            );
        });

        it('should classify COMMISSION charge as commission', () => {
            expect(classifyTransactionClass('COMMISSION 209969  Xmas/000023230101134707005043737740')).toBe(
                TransactionClass.Commission,
            );
        });

        it('should classify SMS CHARGE as sms_charge', () => {
            expect(
                classifyTransactionClass('SMS CHARGE   SMS ALERT CHARGE for 1st - 31stAUG 2022FROM HEAD OFFICE BRANCH'),
            ).toBe(TransactionClass.SmsCharge);
        });

        it('should classify CARDS TRANSACTIONS as card_scheme_fee', () => {
            expect(
                classifyTransactionClass(
                    'CARDS TRANSACTIONS   Bng cost of Verve Bin Ranging fees and VATFROM CENTER BRANCH',
                ),
            ).toBe(TransactionClass.CardSchemeFee);
        });

        it('should classify SETTLEMENT TRANSACTIONS as settlement', () => {
            expect(
                classifyTransactionClass(
                    'SETTLEMENT TRANSACTIONS   30.11.2022 ISW SETT DUE ALLAWEE TECHNOLOGIESFROM HEAD OFFICE BRANCH',
                ),
            ).toBe(TransactionClass.Settlement);
        });

        it('should classify REVERSAL as reversal', () => {
            expect(
                classifyTransactionClass('REVERSAL OF ENTRY   000023221114161810005040359302FROM HEAD OFFICE BRANCH'),
            ).toBe(TransactionClass.Reversal);
        });

        it('should classify LEGAL SEARCH FEES as legal_fee', () => {
            expect(
                classifyTransactionClass('LEGAL SEARCH FEES   ALLAWEE TECHNOLOGIES LTDFROM HEAD OFFICE BRANCH'),
            ).toBe(TransactionClass.LegalFee);
        });

        it('should classify LOYALTY REWARD as loyalty_reward', () => {
            expect(classifyTransactionClass('LOYALTY REWARD   Loyalty Reward - AugustFROM HEAD OFFICE BRANCH')).toBe(
                TransactionClass.LoyaltyReward,
            );
        });

        it('should classify unknown narrations as unknown', () => {
            expect(classifyTransactionClass('MISC. SOMETHING UNRECOGNISED')).toBe(TransactionClass.Unknown);
        });
    });
});
