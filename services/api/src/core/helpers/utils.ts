import * as crypto from 'crypto';
import * as _ from 'lodash';
import pickKeys from 'json-pick-keys';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HttpException, HttpStatus } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { format, parse, parseISO } from 'date-fns';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { ApiVersion } from './enums';

export class Utils {
    public static generateRandomNumber(length): number {
        // Generate a random {length} digit code
        return Math.floor(Math.pow(10, length - 1) + Math.random() * Math.pow(10, length - 1) * 9);
    }

    /**
     * @deprecated Use generateRandomBytes instead
     * @param length
     * @returns
     */
    public static generateRandomID(length): string {
        return crypto.randomBytes(length / 2).toString('hex');
    }

    public static generateRandomBytes(length: number, encoding: BufferEncoding = 'hex'): string {
        return crypto.randomBytes(length / 2).toString(encoding);
    }

    static generateRandom(length: number): string {
        const alphabet = '$-_@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        return customAlphabet(alphabet, length)();
    }

    public static toSlug(value: string) {
        return _.kebabCase(value);
    }

    public static fromSlug(value: string) {
        const safe = this.safeString(value);
        return safe ? this.toTitleCase(safe.replaceAll(/[-_]/g, ' ')) : safe;
    }

    public static toSentenceCase(str: string) {
        return str && _.upperFirst(str.toLowerCase());
    }

    public static toCamelCase(str: string) {
        return str && _.camelCase(str);
    }

    public static toTitleCase(str: string) {
        return (
            str &&
            str
                .trim()
                .split(' ')
                .map((v) => _.upperFirst(v.toLowerCase()))
                .join(' ')
        );
    }

    /**
     * Removes all Nil values from object - undefined, null
     *
     * @param {Object} obj
     * @return {object}
     */
    public static removeNilValues<T = any>(obj: T): T {
        return _.omitBy(obj, _.isNil);
    }

    /**
     * Removes all Nil values from object - undefined, null (nested)
     *
     * @param {Object} obj
     * @return {object}
     */
    public static removeNilValuesDeep(obj: Record<string, unknown>): any {
        const o = _.omitBy(obj, _.isNil);

        //transform the children objects
        _.each(o, function (val: any, key: any) {
            if (!Array.isArray(val) && typeof val === 'object') {
                o[key] = _.omitBy(val, _.isNil);
                if (Object.keys(o[key]).length === 0) o[key] = undefined;
            }
        });

        return _.omitBy(o, _.isNil);
    }

    public static pickKeys<T = any>(obj: T, spaceSeparatedKeys: string) {
        return pickKeys(obj, spaceSeparatedKeys) as T;
    }

    public static renameKey<T = any>(obj: T, oldKey: string, newKey: string): Record<string, any> {
        return _.reduce(
            obj,
            (newObj, value, key) => {
                newObj[oldKey === key ? newKey : key] = value;
                return newObj;
            },
            {},
        );
    }

    public static enumToArray(_enum) {
        const enumsArray = [];
        for (const prop of Object.keys(_enum)) {
            enumsArray.push(_enum[prop]);
        }
        return enumsArray;
    }

    static async ensureParams(metatype, value, exception?: HttpException) {
        const object = plainToInstance(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
            throw exception
                ? exception
                : new HttpException(`$${errors[0].property} Validation failed`, HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    static async deepMerge(obj, ...sources) {
        return _.merge(obj, ...sources);
    }

    static removeNonAlphanumeric(str: string) {
        return str.replace(/\W/g, '');
    }

    static round(value: number, minimumFractionDigits = 0, maximumFractionDigits = 2) {
        const formattedValue = value.toLocaleString('en', {
            useGrouping: false,
            minimumFractionDigits,
            maximumFractionDigits,
        });
        return Number(formattedValue);
    }

    static safeString(str: string, transformFn?: (str: string) => string) {
        return str && str.trim() !== '' ? (transformFn ? transformFn(str.trim()) : str) : null;
    }

    static safeStringEqual(x: string, y: string) {
        return x && x.toLowerCase() == y.toLowerCase();
    }

    public static parseCurrencyToFloat(currency: string) {
        return currency ? Number(currency.replace(/[^0-9.-]+/g, '')) : 0;
    }

    static safeNumber(num: any) {
        if (num === null || (typeof num === 'string' && num.trim() === '')) {
            return null;
        }
        return !isNaN(num) ? Number(num) : null;
    }

    static safeBoolean(value: any): boolean {
        return /(true|on|1)/gi.test(value);
    }

    static isObject(value: any): boolean {
        return _.isObject(value);
    }

    static isStatusCodeSuccess(statusCode: number): boolean {
        return statusCode >= 200 && statusCode < 300;
    }

    static isStatusCodeBad(statusCode: number): boolean {
        return statusCode >= 400 && statusCode < 500;
    }

    static safeDate(str: string, formatString?: string): Date {
        if (str === null || str?.trim().length === 0) {
            return null;
        }

        if (formatString) {
            return parse(str, formatString, new Date());
        }

        return parseISO(str);
    }

    static parseDateToStr(date: Date, formatString: string) {
        let formatted = null;
        if (date === null) {
            return null;
        }
        try {
            formatted = format(date, formatString);
        } catch (e) {}

        return formatted;
    }

    static convertDateFormat(str: string, fromFormat: string, toFormat: string): string {
        const date = this.safeDate(str, fromFormat);
        return this.parseDateToStr(date, toFormat);
    }

    public static parseInt64ToCurrency(amount: number, currency: TransactionCurrency): string {
        return this.parseFloatToCurrency(amount / 100, currency);
    }

    public static parseFloatToCurrency(float: number, currency: TransactionCurrency): string {
        const getSymbol = (val: TransactionCurrency) => {
            if (val === TransactionCurrency.NGN) {
                return '₦';
            }
            if (val === TransactionCurrency.USD) {
                return '$';
            }
            return `${val} `;
        };

        return float ? getSymbol(currency) + Number(float.toFixed(2)).toLocaleString() : null;
    }
}

/**
 * Should check if the requested api version is supported by the anchor api version
 *
 * @param reqApiVersion api version to check in date format YYYY-MM-DD
 * @param targetApiVersion api version to target in date format YYYY-MM-DD
 * @returns  boolean
 */
export function supportsApiVersion(reqApiVersion: string, targetApiVersion: ApiVersion): boolean {
    return new Date(reqApiVersion) >= new Date(targetApiVersion);
}

/**
 * Should check if the requested api version is before a target api version
 *
 * @param reqApiVersion api version to check in date format YYYY-MM-DD
 * @param targetApiVersion api version to target in date format YYYY-MM-DD
 * @returns  boolean
 */
export function beforeApiVersion(reqApiVersion: string, targetApiVersion: ApiVersion): boolean {
    return new Date(reqApiVersion) < new Date(targetApiVersion);
}

export function redactObject<T = any>(obj: T, redaction: string[]): T {
    const redact = '... ' + redaction.map((v) => '*' + v).join(' ');
    return Utils.pickKeys(obj, redact);
}
