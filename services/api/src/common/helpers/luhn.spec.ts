import { Luhn } from './luhn';

describe('LuhnHelper', () => {
    describe('generateWithPrefix', () => {
        it('should generate a valid Luhn number with the given prefix and length', () => {
            const prefix = '1234';
            const length = 10;
            const result = Luhn.generateWithPrefix(prefix, length);
            const isValidLuhn = Luhn.validateLuhn(result); // Updated to use validateLuhn
            expect(isValidLuhn).toBeTruthy();
            expect(result.length).toBe(length);
            expect(result.startsWith(prefix)).toBeTruthy();
        });

        it('should return an empty string if the length is less than the prefix length', () => {
            const prefix = '1234';
            const length = 3;
            const result = Luhn.generateWithPrefix(prefix, length);
            expect(result).toBe('');
        });
    });

    describe('validateLuhn', () => {
        it('should return true for a valid Luhn number', () => {
            const number = '1234567890123452'; // Replace with a valid Luhn number
            const isValidLuhn = Luhn.validateLuhn(number);
            expect(isValidLuhn).toBeTruthy();
        });

        it('should return false for an invalid Luhn number', () => {
            const number = '1234567890123456'; // Replace with an invalid Luhn number
            const isValidLuhn = Luhn.validateLuhn(number);
            expect(isValidLuhn).toBeFalsy();
        });
    });
});
