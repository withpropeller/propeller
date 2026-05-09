import { beforeApiVersion, supportsApiVersion, Utils } from './utils';
import { ApiVersion } from './enums';

describe('supportsApiVersion', () => {
    it('should return true if the requested api version is equal to the anchor api version', () => {
        const reqApiVersion = '2023-02-01';
        const anchorApiVersion = ApiVersion.v2023_02_01;
        const result = supportsApiVersion(reqApiVersion, anchorApiVersion);
        expect(result).toBe(true);
    });

    it('should return true if the requested api version is greater than the anchor api version', () => {
        const reqApiVersion = '2024-05-01';
        const anchorApiVersion = ApiVersion.v2023_02_01;
        const result = supportsApiVersion(reqApiVersion, anchorApiVersion);
        expect(result).toBe(true);
    });

    it('should return false if the requested api version is less than the anchor api version', () => {
        const reqApiVersion = '2021-12-31';
        const anchorApiVersion = ApiVersion.v2024_05_01;
        const result = supportsApiVersion(reqApiVersion, anchorApiVersion);
        expect(result).toBe(false);
    });

    it('should return false if the requested api version is not a valid date', () => {
        const reqApiVersion = 'invalid-date';
        const anchorApiVersion = ApiVersion.v2024_05_01;
        const result = supportsApiVersion(reqApiVersion, anchorApiVersion);
        expect(result).toBe(false);
    });
});

describe('beforeApiVersion', () => {
    it('should return true if the requested api version is before the target api version', () => {
        const reqApiVersion = '2022-01-01';
        const targetApiVersion = ApiVersion.v2023_02_01;
        const result = beforeApiVersion(reqApiVersion, targetApiVersion);
        expect(result).toBe(true);
    });

    it('should return false if the requested api version is equal to the target api version', () => {
        const reqApiVersion = '2023-02-01';
        const targetApiVersion = ApiVersion.v2023_02_01;
        const result = beforeApiVersion(reqApiVersion, targetApiVersion);
        expect(result).toBe(false);
    });

    it('should return false if the requested api version is after the target api version', () => {
        const reqApiVersion = '2024-05-01';
        const targetApiVersion = ApiVersion.v2023_02_01;
        const result = beforeApiVersion(reqApiVersion, targetApiVersion);
        expect(result).toBe(false);
    });

    it('should return false if the requested api version is not a valid date', () => {
        const reqApiVersion = 'invalid-date';
        const targetApiVersion = ApiVersion.v2023_02_01;
        const result = beforeApiVersion(reqApiVersion, targetApiVersion);
        expect(result).toBe(false);
    });
});

describe('safeBoolean', () => {
    it('should return true for truthy values', () => {
        const result = Utils.safeBoolean('true');
        expect(result).toBe(true);
    });

    it('should return false for falsy values', () => {
        const result = Utils.safeBoolean('false');
        expect(result).toBe(false);
    });

    it('should return false for non-boolean values', () => {
        const result = Utils.safeBoolean(undefined);
        expect(result).toBe(false);
    });

    it('should return false for non-boolean values', () => {
        const result = Utils.safeBoolean(null);
        expect(result).toBe(false);
    });

    it('should return false for non-boolean values', () => {
        const result = Utils.safeBoolean('');
        expect(result).toBe(false);
    });
});

describe('renameKey', () => {
    it('should rename the key in the object', () => {
        const obj = { oldKey: 'value' };
        const result = Utils.renameKey(obj, 'oldKey', 'newKey');
        expect(result).toEqual({ newKey: 'value' });
    });

    it('should not change the object if the old key does not exist', () => {
        const obj = { someKey: 'value' };
        const result = Utils.renameKey(obj, 'oldKey', 'newKey');
        expect(result).toEqual({ someKey: 'value' });
    });

    it('should handle an empty object', () => {
        const obj = {};
        const result = Utils.renameKey(obj, 'oldKey', 'newKey');
        expect(result).toEqual({});
    });

    it('should rename the key and keep other keys intact', () => {
        const obj = { oldKey: 'value', anotherKey: 'anotherValue' };
        const result = Utils.renameKey(obj, 'oldKey', 'newKey');
        expect(result).toEqual({ newKey: 'value', anotherKey: 'anotherValue' });
    });

    it('should handle nested objects', () => {
        const obj = { oldKey: { nestedKey: 'nestedValue' } };
        const result = Utils.renameKey(obj, 'oldKey', 'newKey');
        expect(result).toEqual({ newKey: { nestedKey: 'nestedValue' } });
    });
});
