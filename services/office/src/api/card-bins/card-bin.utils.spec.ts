import { calculateBin, calculateBinLength } from './card-bin.utils';
import { CardBinErrors, CardBinLength } from './card-bin.enums';

// Mock CardBinException to avoid resolving @core/exceptions path alias in Jest
jest.mock('./card-bin.exception', () => ({
    CardBinException: class CardBinException extends Error {
        constructor(public readonly err: any, public readonly code: string, public readonly status?: number) {
            super(typeof err === 'string' ? err : JSON.stringify(err));
            this.name = 'CardBinException';
        }
    },
}));

// ---------------------------------------------------------------------------
// calculateBinLength
// ---------------------------------------------------------------------------

describe('calculateBinLength', () => {
    it('returns TenMillion for range 5249103010000000 – 5249103019999999', () => {
        expect(calculateBinLength(['5249103010000000', '5249103019999999'])).toBe(CardBinLength.TenMillion);
    });

    it('returns TenMillion for range 5249103030000000 – 5249103039999999', () => {
        expect(calculateBinLength(['5249103030000000', '5249103039999999'])).toBe(CardBinLength.TenMillion);
    });

    it('returns HundredMillion for range 5061464000900000000 – 5061464000999999999', () => {
        expect(calculateBinLength(['5061464000900000000', '5061464000999999999'])).toBe(CardBinLength.HundredMillion);
    });

    it('returns OneBillion for range 5061465010000000000 – 5061465010999999999', () => {
        expect(calculateBinLength(['5061465010000000000', '5061465010999999999'])).toBe(CardBinLength.OneBillion);
    });

    it('returns OneMillion for a 1M range', () => {
        // 5249100000000000 + 1,000,000 - 1 = 5249100000999999
        expect(calculateBinLength(['5249100000000000', '5249100000999999'])).toBe(CardBinLength.OneMillion);
    });

    it('returns HundredThousands for a 100k range', () => {
        // 5249100000000000 + 100,000 - 1 = 5249100000099999
        expect(calculateBinLength(['5249100000000000', '5249100000099999'])).toBe(CardBinLength.HundredThousands);
    });

    it('returns HundredMillion for a 100M 16-digit range', () => {
        expect(calculateBinLength(['5249100000000000', '5249100099999999'])).toBe(CardBinLength.HundredMillion);
    });

    it('throws CardBinException with InvalidBinRange code for an unrecognised range size', () => {
        expect(() => calculateBinLength(['5249103010000000', '5249103010000099'])).toThrow(
            expect.objectContaining({ code: CardBinErrors.InvalidBinRange }),
        );
    });

    it('throws with a message describing the unrecognised size', () => {
        expect(() => calculateBinLength(['5249103010000000', '5249103010000099'])).toThrow('100');
    });
});

// ---------------------------------------------------------------------------
// calculateBin
// ---------------------------------------------------------------------------

describe('calculateBin', () => {
    it('extracts bin 524910301 from range 5249103010000000 – 5249103019999999', () => {
        expect(calculateBin(['5249103010000000', '5249103019999999'])).toBe('524910301');
    });

    it('extracts bin 524910303 from range 5249103030000000 – 5249103039999999', () => {
        expect(calculateBin(['5249103030000000', '5249103039999999'])).toBe('524910303');
    });

    it('extracts bin 50614640009 from range 5061464000900000000 – 5061464000999999999', () => {
        expect(calculateBin(['5061464000900000000', '5061464000999999999'])).toBe('50614640009');
    });

    it('extracts bin 5061465010 from range 5061465010000000000 – 5061465010999999999', () => {
        expect(calculateBin(['5061465010000000000', '5061465010999999999'])).toBe('5061465010');
    });

    it('returns the full string when start equals end', () => {
        expect(calculateBin(['5249103010000000', '5249103010000000'])).toBe('5249103010000000');
    });

    it('returns empty string when there is no common prefix', () => {
        expect(calculateBin(['1000000000000000', '9000000000000000'])).toBe('');
    });
});
