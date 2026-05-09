import { PipeTransform, ArgumentMetadata, Injectable } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AppException } from '@core/exceptions';

@Injectable()
export class ParamValidationPipe implements PipeTransform<any> {
    async transform(value: Record<string, any>, metadata: ArgumentMetadata) {

        if (Object.keys(value).length === 0) {
            return value;
        }

        if (Array.isArray(value)) {
            throw AppException.BAD_REQUEST.setMessage('Validation failed, an object expected');
        }

        const { metatype } = metadata;
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }

        const object = plainToClass(metatype, value);
        Object.keys(object).forEach((k) => {
            if (typeof object[k] === 'string') {
                object[k] = object[k].trim();
            }
        });
        const errors = await validate(object, { whitelist: true, forbidNonWhitelisted: true });
        if (errors && errors.length > 0) {
            const errorsList = this.extractErrorList(errors);
            throw AppException.BAD_REQUEST.setMessage('Validation failed').setError(errorsList);
        }
        return object;
    }

    private toValidate(metatype): boolean {
        const types = [String, Boolean, Number, Array, Object];
        return !types.find((type) => metatype === type);
    }

    private extractErrorList(errors: ValidationError[]): { property: string; error: string }[] {
        let erorrList = [];

        for (const [k, v] of Object.entries(errors)) {
            erorrList = erorrList.concat(loop(v));
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

        return erorrList;
    }
}
