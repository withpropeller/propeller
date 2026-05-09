import * as crypto from 'crypto';
import * as _ from 'lodash';
import pickKeys from 'json-pick-keys';
import * as moment from 'moment-timezone';
import { differenceInMilliseconds, format, parse, parseISO, subDays } from 'date-fns';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { customAlphabet } from 'nanoid';

export class Utils {
    public static generateRandomNumber(length): number {
        // Generate a random {length} digit code
        return Math.floor(Math.pow(10, length - 1) + Math.random() * Math.pow(10, length - 1) * 9);
    }

    /**
     * @deprecated Use generateRandomBytes instead
     */
    public static generateRandomID(length): string {
        return crypto.randomBytes(length / 2).toString('hex');
    }

    public static generateRandomBytes(length, encoding: BufferEncoding = 'hex'): string {
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

    static async deepMerge(obj, ...sources) {
        return _.merge(obj, ...sources);
    }

    static removeNonAlphanumeric(str: string) {
        return str.replace(/\W/g, '');
    }

    static dateInFuture(date1: Date, date2 = new Date()) {
        return differenceInMilliseconds(date1, date2) > 0;
    }

    static dayOfTheMonth(date) {
        return moment(date).date();
    }

    static daysAgo(start: Date, number: number) {
        return subDays(start, number);
    }

    static round(value: number, minimumFractionDigits = 0, maximumFractionDigits = 2) {
        const formattedValue = value.toLocaleString('en', {
            useGrouping: false,
            minimumFractionDigits,
            maximumFractionDigits,
        });
        return Number(formattedValue);
    }

    static safeDate(str: string, formartString?: string): Date {
        if (str === null || str?.trim().length === 0) {
            return null;
        }

        if (formartString) {
            return parse(str, formartString, new Date());
        }

        return parseISO(str);
    }

    static parseDateToStr(date: Date, formartString: string) {
        let formated = null;
        if (date === null) {
            return null;
        }
        try {
            formated = format(date, formartString);
        } catch (e) {}

        return formated;
    }

    static safeBirthDate(str: string, formartString?: string): string {
        const date = this.safeDate(str, formartString);
        return this.parseDateToStr(date, 'yyyy-MM-dd');
    }

    static convertDateFormat(str: string, fromFormat: string, toFormat: string): string {
        const date = this.safeDate(str, fromFormat);
        return this.parseDateToStr(date, toFormat);
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

        return float ? getSymbol(currency) + Number(float.toFixed(1)).toLocaleString() : null;
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
}
