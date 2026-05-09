import { type PhoneNumber, PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { AppException } from '../exceptions/app.exception.js';

/**
 * Helper class wrapping google-libphonenumber.
 * https://github.com/ruimarinho/google-libphonenumber
 */
export class PhoneUtils {
  static phoneUtil = PhoneNumberUtil.getInstance();

  static comparePhone(localFormat: string, internationalFormat: string): boolean {
    return PhoneUtils.isValidNumber(localFormat, 'NG') && PhoneUtils.format(localFormat, 'NG') === internationalFormat;
  }

  static isValidNumber(phone: string, countryCode = ''): boolean {
    try {
      const number = PhoneUtils.phoneUtil.parse(phone, countryCode);
      if (!number) return false;
      return PhoneUtils.phoneUtil.isValidNumber(number);
    } catch {
      return false;
    }
  }

  static format(phone: string, countryCode = '', format: PhoneNumberFormat = PhoneNumberFormat.E164): string {
    try {
      const number = PhoneUtils.phoneUtil.parse(phone, countryCode);
      return PhoneUtils.phoneUtil.format(number, format);
    } catch (e) {
      throw AppException.BadRequest.setError(e).setMessage('Phone number must be valid');
    }
  }

  static formatNational(
    phone: string,
    countryCode = 'NG',
    format: PhoneNumberFormat = PhoneNumberFormat.NATIONAL,
  ): string {
    try {
      const number = PhoneUtils.phoneUtil.parse(phone, countryCode);
      return PhoneUtils.phoneUtil.format(number, format).replace(/\s/g, '');
    } catch (e) {
      throw AppException.BadRequest.setError(e).setMessage('Phone number must be valid');
    }
  }

  static getCountryPrefix(phone: string): string {
    try {
      const number = PhoneUtils.phoneUtil.parseAndKeepRawInput(phone, '');
      const code = number?.getCountryCode();
      if (code === undefined) {
        throw AppException.BadRequest.setMessage('Phone number must be valid');
      }
      return code.toString();
    } catch (e) {
      throw AppException.BadRequest.setError(e).setMessage('Phone number must be valid');
    }
  }

  static getCountryCode(phone: string): string {
    try {
      const number = PhoneUtils.phoneUtil.parseAndKeepRawInput(phone, '');
      const region = PhoneUtils.phoneUtil.getRegionCodeForNumber(number);
      if (!region) {
        throw AppException.BadRequest.setMessage('Phone number must be valid');
      }
      return region;
    } catch (e) {
      throw AppException.BadRequest.setError(e).setMessage('Phone number must be valid');
    }
  }

  static getNationalNumber(phone: string, countryCode = ''): string {
    try {
      const number = PhoneUtils.phoneUtil.parseAndKeepRawInput(phone, countryCode);
      const national = number?.getNationalNumber();
      if (national === undefined) {
        throw AppException.BadRequest.setMessage('Phone number must be valid');
      }
      return national.toString();
    } catch (e) {
      throw AppException.BadRequest.setError(e).setMessage('Phone number must be valid');
    }
  }
}
