import { PipeTransform, ArgumentMetadata, Injectable, Type } from '@nestjs/common';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AppException, CustomException } from '@core/exceptions';

@Injectable()
export class ParamValidationPipe implements PipeTransform<any> {
    async transform(value: Record<string, any>, metadata: ArgumentMetadata) {
        /*if (metadata.type == 'query' && Object.keys(value).length === 0) {
            return value;
        }*/

        if (Array.isArray(value)) {
            throw AppException.BadRequest.setMessage('Validation failed, an object expected');
        }

        const { metatype } = metadata;
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }

        return ParamValidationPipe.ensureParams(metatype, value);
    }

    private toValidate(metatype): boolean {
        const types = [String, Boolean, Number, Array, Object];
        return !types.find((type) => metatype === type);
    }

    static async ensureParams(
        metatype: Type<any>,
        value: Record<string, any>,
        validatorOpts: ValidatorOptions = {},
        exception?: CustomException,
    ) {
        const object = plainToClass(metatype, value);
        Object.keys(object).forEach((k) => {
            if (typeof object[k] === 'string') {
                object[k] = object[k].trim();
            }
        });
        const errors = await validate(object, {
            whitelist: true,
            forbidNonWhitelisted: true,
            ...validatorOpts,
        });
        if (errors && errors.length > 0) {
            const errorsList = this.extractErrorList(errors);
            throw exception ? exception : AppException.BadRequest.setMessage('Validation failed').setError(errorsList);
        }
        return object;
    }

    private static extractErrorList(errors: ValidationError[]): { property: string; error: string }[] {
        let errorList = [];

        for (const [, v] of Object.entries(errors)) {
            errorList = errorList.concat(loop(v));
        }

        function loop(error: ValidationError, prefix = ''): { property: string; error: string }[] {
            let arr = [];
            const errorChildren = error.children ?? [];
            if (errorChildren.length == 0) {
                arr.push({ property: prefix + error.property, error: Object.values(error.constraints)[0] });
                return arr;
            }

            for (const child of errorChildren) {
                arr = arr.concat(loop(child, prefix + error.property + '.'));
            }

            return arr;
        }

        return errorList;
    }
}

export class CustomFnValidationPipe implements PipeTransform<any> {
    constructor(private validateFunc: (value: Record<string, any>) => void) {}

    async transform(value: Record<string, any>, metadata: ArgumentMetadata) {
        return this.validateFunc(value);
    }
}
