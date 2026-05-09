import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { format, parse, parseISO } from 'date-fns';
import pickKeys from 'json-pick-keys';
import * as _ from 'lodash';
import { customAlphabet } from 'nanoid';
import { HttpException, HttpStatus } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { CURRENCY_SYMBOLS } from './constants.js';
import type { ApiVersion } from './enums.js';

export class Utils {
  public static generateRandomNumber(length: number): number {
    return Math.floor(10 ** (length - 1) + Math.random() * 10 ** (length - 1) * 9);
  }

  /**
   * @deprecated Use generateRandomBytes instead.
   */
  public static generateRandomID(length: number): string {
    return randomBytes(length / 2).toString('hex');
  }

  public static generateRandomBytes(length: number, encoding: BufferEncoding = 'hex'): string {
    return randomBytes(length / 2).toString(encoding);
  }

  static generateRandom(length: number): string {
    const alphabet = '$-_@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return customAlphabet(alphabet, length)();
  }

  public static toSlug(value: string): string {
    return _.kebabCase(value);
  }

  public static fromSlug(value: string): string | null {
    const safe = Utils.safeString(value);
    return safe ? Utils.toTitleCase(safe.replaceAll(/[-_]/g, ' ')) : safe;
  }

  public static toSentenceCase(str: string): string {
    return str && _.upperFirst(str.toLowerCase());
  }

  public static toCamelCase(str: string): string {
    return str && _.camelCase(str);
  }

  public static toTitleCase(str: string): string {
    return (
      str &&
      str
        .trim()
        .split(' ')
        .map((v) => _.upperFirst(v.toLowerCase()))
        .join(' ')
    );
  }

  /** Removes all undefined/null values from a (shallow) object. */
  public static removeNilValues<T = unknown>(obj: T): T {
    return _.omitBy(obj as object, _.isNil) as T;
  }

  /** Removes all undefined/null values from an object, recursively. */
  public static removeNilValuesDeep(obj: Record<string, unknown>): Record<string, unknown> {
    const o = _.omitBy(obj, _.isNil) as Record<string, unknown>;
    _.each(o, (val, key) => {
      if (val !== null && !Array.isArray(val) && typeof val === 'object') {
        o[key] = _.omitBy(val as object, _.isNil);
        if (Object.keys(o[key] as object).length === 0) o[key] = undefined;
      }
    });
    return _.omitBy(o, _.isNil) as Record<string, unknown>;
  }

  public static pickKeys<T>(obj: T, spaceSeparatedKeys: string): T {
    return pickKeys(obj, spaceSeparatedKeys) as T;
  }

  public static renameKey<T>(obj: T, oldKey: string, newKey: string): Record<string, unknown> {
    return _.reduce(
      obj as object,
      (newObj: Record<string, unknown>, value, key) => {
        newObj[oldKey === key ? newKey : (key as string)] = value;
        return newObj;
      },
      {},
    );
  }

  public static enumToArray<T>(_enum: Record<string, T>): T[] {
    return Object.values(_enum);
  }

  static async ensureParams<T extends object>(
    metatype: new () => T,
    value: unknown,
    exception?: HttpException,
  ): Promise<unknown> {
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      const property = errors[0]?.property ?? 'param';
      throw exception ?? new HttpException(`${property} validation failed`, HttpStatus.BAD_REQUEST);
    }
    return value;
  }

  static async deepMerge<T>(obj: T, ...sources: Partial<T>[]): Promise<T> {
    return _.merge(obj as object, ...sources) as T;
  }

  static removeNonAlphanumeric(str: string): string {
    return str.replace(/\W/g, '');
  }

  static round(value: number, minimumFractionDigits = 0, maximumFractionDigits = 2): number {
    const formatted = value.toLocaleString('en', {
      useGrouping: false,
      minimumFractionDigits,
      maximumFractionDigits,
    });
    return Number(formatted);
  }

  static safeString(str: string, transformFn?: (str: string) => string): string | null {
    return str && str.trim() !== '' ? (transformFn ? transformFn(str.trim()) : str) : null;
  }

  static safeStringEqual(x: string, y: string): boolean {
    return Boolean(x) && x.toLowerCase() === y.toLowerCase();
  }

  public static parseCurrencyToFloat(currency: string): number {
    return currency ? Number(currency.replace(/[^0-9.-]+/g, '')) : 0;
  }

  static safeNumber(num: unknown): number | null {
    if (num === null || (typeof num === 'string' && num.trim() === '')) return null;
    const n = Number(num);
    return Number.isNaN(n) ? null : n;
  }

  static safeBoolean(value: unknown): boolean {
    return /(true|on|1)/gi.test(String(value));
  }

  static isObject(value: unknown): boolean {
    return _.isObject(value);
  }

  static isStatusCodeSuccess(statusCode: number): boolean {
    return statusCode >= 200 && statusCode < 300;
  }

  static isStatusCodeBad(statusCode: number): boolean {
    return statusCode >= 400 && statusCode < 500;
  }

  static safeDate(str: string, formatString?: string): Date | null {
    if (str === null || str?.trim().length === 0) return null;
    if (formatString) return parse(str, formatString, new Date());
    return parseISO(str);
  }

  static parseDateToStr(date: Date | null, formatString: string): string | null {
    if (date === null) return null;
    try {
      return format(date, formatString);
    } catch {
      return null;
    }
  }

  static convertDateFormat(str: string, fromFormat: string, toFormat: string): string | null {
    const date = Utils.safeDate(str, fromFormat);
    return Utils.parseDateToStr(date, toFormat);
  }

  /** Convert minor units (e.g. kobo) to a formatted string with currency symbol. */
  public static parseMinorToCurrency(amount: number, currency: string): string | null {
    return Utils.parseFloatToCurrency(amount / 100, currency);
  }

  public static parseFloatToCurrency(value: number, currency: string): string | null {
    if (!value && value !== 0) return null;
    const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
    return symbol + Number(value.toFixed(2)).toLocaleString();
  }
}

/** True if the requested API version is at or after the target. */
export function supportsApiVersion(reqApiVersion: string, targetApiVersion: ApiVersion): boolean {
  return new Date(reqApiVersion) >= new Date(targetApiVersion);
}

/** True if the requested API version is before the target. */
export function beforeApiVersion(reqApiVersion: string, targetApiVersion: ApiVersion): boolean {
  return new Date(reqApiVersion) < new Date(targetApiVersion);
}

export function redactObject<T>(obj: T, redaction: string[]): T {
  const redact = `... ${redaction.map((v) => `*${v}`).join(' ')}`;
  return Utils.pickKeys(obj, redact);
}
