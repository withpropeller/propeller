import { PhoneNumberFormat, PhoneNumberUtil, PhoneNumber } from 'google-libphonenumber';
import { BadRequestException } from '@nestjs/common';

/**
 * Helper  class to make working  with google-libphonenumber easier
 * https://github.com/ruimarinho/google-libphonenumber
 */
export class PhoneUtils {
    static phoneUtil = PhoneNumberUtil.getInstance();

    static comparePhone(localFormat: string, internationalFormat: string) {
        return this.isValidNumber(localFormat, 'NG') && this.format(localFormat, 'NG') === internationalFormat;
    }

    static isValidNumber(phone: string, countryCode = '') {
        let number: PhoneNumber;
        try {
            number = this.phoneUtil.parse(phone, countryCode);
        } catch (e) {}

        return number && this.phoneUtil.isValidNumber(number);
    }

    static format(phone: string, countryCode = '', format = PhoneNumberFormat.E164) {
        try {
            const number = this.phoneUtil.parse(phone, countryCode);
            return this.phoneUtil.format(number, format);
        } catch (e) {
            throw new BadRequestException('Phone number must be valid');
        }
    }

    static formatNational(phone: string, countryCode = 'NG', format = PhoneNumberFormat.NATIONAL) {
        try {
            const number = this.phoneUtil.parse(phone, countryCode);
            return this.phoneUtil.format(number, format).replace(/\s/g, '');
        } catch (e) {
            throw new BadRequestException('Phone number must be valid');
        }
    }

    static getCountryCode(phone: string): string {
        try {
            const number = this.phoneUtil.parseAndKeepRawInput(phone, '');
            return number.getCountryCode().toString();
        } catch (e) {
            throw new BadRequestException('Phone number must be valid');
        }
    }

    static getNationalNumber(phone: string, countryCode = ''): string {
        try {
            const number = this.phoneUtil.parseAndKeepRawInput(phone, countryCode);
            return number.getNationalNumber().toString();
        } catch (e) {
            throw new BadRequestException('Phone number must be valid');
        }
    }

    static getInternationalNumber(phone: string, countryCode = '') {
        try {
            const number = this.phoneUtil.parseAndKeepRawInput(phone, countryCode);
            return this.phoneUtil.format(number, PhoneNumberFormat.E164);
        } catch (e) {
            throw new BadRequestException('Phone number must be valid');
        }
    }
}
