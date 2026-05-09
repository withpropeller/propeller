import { validatesLegalAge } from './customer.utils';
import { ensureCustomerLegalAddress } from './customer.utils';
import { CustomerType } from './customer.schema';

describe('validatesLegalAge', () => {
    it('should return true for someone 18 or older', () => {
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

        expect(validatesLegalAge(eighteenYearsAgo.toISOString().slice(0, 10))).toBe(true);

        const nineteenYearsAgo = new Date(today.getFullYear() - 19, today.getMonth(), today.getDate());

        expect(validatesLegalAge(nineteenYearsAgo.toISOString().slice(0, 10))).toBe(true);
    });

    it('should return false for someone under 18', () => {
        const today = new Date();
        const seventeenYearsAgo = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());

        expect(validatesLegalAge(seventeenYearsAgo.toISOString().slice(0, 10))).toBe(false);

        const sixteenYearsAgo = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

        expect(validatesLegalAge(sixteenYearsAgo.toISOString().slice(0, 10))).toBe(false);
    });

    it('should handle leap years correctly', () => {
        // Test someone born on Feb 29th in a leap year
        expect(validatesLegalAge('2000-02-29')).toBe(new Date().getFullYear() - 2000 >= 18);
    });

    it('should handle invalid date formats', () => {
        expect(validatesLegalAge('invalid-date')).toBe(false);
    });
});

describe('ensureCustomerLegalAddress', () => {
    it('should throw an error if individual customer address is missing', () => {
        const customer = {
            type: CustomerType.Individual,
            claims: {},
        };

        expect(() => ensureCustomerLegalAddress(customer as any)).toThrowError('Customer claims incomplete');
    });

    it('should not throw an error if individual customer address is present', () => {
        const customer = {
            type: CustomerType.Individual,
            claims: {
                individualAddress: { street: '123 Main St' },
            },
        };

        expect(() => ensureCustomerLegalAddress(customer as any)).not.toThrow();
    });

    it('should throw an error if business customer address is missing', () => {
        const customer = {
            type: CustomerType.Business,
            claims: {},
        };

        expect(() => ensureCustomerLegalAddress(customer as any)).toThrowError('Customer claims incomplete');
    });

    it('should not throw an error if business customer address is present', () => {
        const customer = {
            type: CustomerType.Business,
            claims: {
                businessAddress: { street: '123 Main St' },
            },
        };

        expect(() => ensureCustomerLegalAddress(customer as any)).not.toThrow();
    });
});
