import { ExtractMerchantCategory } from './merchant.utils';

describe('ExtractMerchantCategory', () => {
    it('should return the correct category when merchantMcc is found', () => {
        const merchantMcc = '5814';
        const expectedCategory = 'fast-food';

        const result = ExtractMerchantCategory(merchantMcc);

        expect(result).toBe(expectedCategory);
    });

    it('should return the correct category when merchantMcc is in a single category', () => {
        const merchantMcc = '7230';
        const expectedCategory = 'personal-care';

        const result = ExtractMerchantCategory(merchantMcc);

        expect(result).toBe(expectedCategory);
    });

    it('should return null when merchantMcc is not found', () => {
        const merchantMcc = '0000';

        const result = ExtractMerchantCategory(merchantMcc);

        expect(result).toBeNull();
    });
});
