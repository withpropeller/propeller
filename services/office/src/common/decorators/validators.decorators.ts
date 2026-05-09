import { IdentityType } from '@api/users/users.enums';
import { TagMap, Utils } from '@core/helpers';
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    isNumberString,
    isPositive,
    isInt,
    isISO31661Alpha2,
    length,
} from 'class-validator';
import * as ipaddr from 'ipaddr.js';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'moneyAmount', async: false })
export class MoneyAmount implements ValidatorConstraintInterface {
    validate(amount: number, args: ValidationArguments) {
        return this.validateAmount(amount);
    }

    validateAmount(value: number) {
        return isInt(value) && isPositive(value);
    }

    defaultMessage(validationArguments: ValidationArguments) {
        return `${validationArguments.property} must be a valid money amount`;
    }
}

@ValidatorConstraint({ name: 'Identity value', async: false })
export class KYCIdValue implements ValidatorConstraintInterface {
    validate(id: string, args: ValidationArguments) {
        return this.validateId(id, args);
    }

    validateId(id, args) {
        return args.object.type === IdentityType.BVN ? id.length === 11 : true;
    }

    defaultMessage(validationArguments: ValidationArguments) {
        return `${validationArguments.property} must be a valid BVN`;
    }
}

/**
 * should be able to use syntax like =
 * 1 alias for 1d
 * 1d (first day of the week or first day of month),
 * -1d (first day of the week or last day of month),
 * 1w.1d(first monday) -1w.5d (last friday)
 */

@ValidatorConstraint({ name: 'scheduleDay', async: false })
export class ScheduleDay implements ValidatorConstraintInterface {
    validate(day: number | string, args: ValidationArguments) {
        const dayString = day.toString();
        const frequency = args.object['limitFrequency'];

        if (isNumberString(dayString)) {
            const last = frequency == 'MONTHLY' ? 31 : 5;
            return Math.abs(Utils.safeNumber(day)) > 0 && Math.abs(Utils.safeNumber(day)) <= last;
        }

        const split = dayString.split('.');

        if (split.length == 1) {
            return this.validateSyntax(split[0], 'd');
        }

        if (frequency == 'MONTHLY' && split.length == 2) {
            return this.validateSyntax(split[0], 'w') && this.validateSyntax(split[1], 'd');
        }

        return false;
    }

    validateSyntax(value: string, delimiter?: string) {
        if (value.endsWith(delimiter)) {
            const numberStr = value.slice(0, -1);
            const last = delimiter == 'w' ? 5 : 31;
            return Math.abs(Utils.safeNumber(numberStr)) > 0 && Math.abs(Utils.safeNumber(numberStr)) <= last;
        }
        return false;
    }

    defaultMessage(validationArguments: ValidationArguments) {
        return `${validationArguments.property} must be a valid a schedule day`;
    }
}

/**
 * should be able to use syntax like =
 * 3y or 6m
 */

@ValidatorConstraint({ name: 'offsetDate', async: false })
export class OffsetDate implements ValidatorConstraintInterface {
    validate(offsetDate: string, args: ValidationArguments) {
        offsetDate = offsetDate.trim();
        const dateNumber = offsetDate.slice(0, -1);
        const dateInterval = offsetDate.slice(-1);

        if (isNumberString(dateNumber) && ['y', 'm'].includes(dateInterval)) {
            return true;
        }
        return false;
    }

    defaultMessage(validationArguments: ValidationArguments) {
        return `${validationArguments.property} must be a valid a offset date`;
    }
}

@ValidatorConstraint({ name: 'tagMap', async: false })
export class IsTagMap implements ValidatorConstraintInterface {
    validate(map: TagMap) {
        if (Types.ObjectId.isValid(map?.id)) {
            return true;
        }

        return false;
    }

    defaultMessage(validationArguments: ValidationArguments) {
        return `${validationArguments.property} must be a valid a id`;
    }
}

@ValidatorConstraint({ name: 'isTagId', async: false })
export class IsTagId implements ValidatorConstraintInterface {
    validate(id: string) {
        if (Types.ObjectId.isValid(id)) {
            return true;
        }

        return false;
    }

    defaultMessage(validationArguments: ValidationArguments) {
        return `${validationArguments.property} must be a valid a id`;
    }
}

@ValidatorConstraint({ name: 'cidr', async: false })
export class CIDR implements ValidatorConstraintInterface {
    validate(str: string, args: ValidationArguments) {
        try {
            ipaddr.parseCIDR(str);
            return true;
        } catch (error) {
            return false;
        }
    }

    defaultMessage(validationArguments: ValidationArguments) {
        return `${validationArguments.property} must be a valid a cidr`;
    }
}

@ValidatorConstraint({ name: 'iso31661-2', async: false })
export class ISO316612 implements ValidatorConstraintInterface {
    validate(str: string, args: ValidationArguments) {
        if (typeof str !== 'string') {
            return false;
        }

        const code = str.trim()?.split('-');
        if (isISO31661Alpha2(code[0]) && length(code[1], 2, 2)) {
            return true;
        }

        return false;
    }

    defaultMessage(validationArguments: ValidationArguments) {
        return `${validationArguments.property} must be a valid ISO 3166-2 region code`;
    }
}
