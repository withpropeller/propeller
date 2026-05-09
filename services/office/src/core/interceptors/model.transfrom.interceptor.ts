import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Document } from 'mongoose';
import { classToPlain } from 'class-transformer';
import { isArray, isObject } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { extractUser } from '@common/decorators';

interface PlainLiteralObject {
    [key: string]: any;
}

@Injectable()
export class ModelTransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const user = extractUser(context.switchToHttp().getRequest());
        const roles = (user && user.roles) || ([] as any);
        return next
            .handle()
            .pipe(
                map((res: PlainLiteralObject | PlainLiteralObject[]) =>
                    isObject(res) || isArray(res) ? this.mapViewModel(res, roles) : res,
                ),
            );
    }

    mapViewModel(response: PlainLiteralObject | PlainLiteralObject[], roles: string[]) {
        if (this.hasDataProperty(response)) {
            return {
                ...response,
                data: this.mapViewModel(response.data, roles),
            };
        }
        if ((response as any).items) {
            const { items, ...rest } = response as any;
            return { ...rest, data: this.mapViewModel(items, roles) };
        }
        if (!Array.isArray(response)) {
            return this.transformToPlain(response, roles);
        }
        return response.map((item) => this.transformToPlain(item, roles));
    }

    transformToPlain(plainOrClass, roles: string[]) {
        // if (this.hasToJSON(plainOrClass)) {
        if (plainOrClass instanceof Document) {
            return plainOrClass;
        }

        if (plainOrClass && plainOrClass.constructor) {
            return classToPlain(plainOrClass, { groups: roles });
        }
    }

    /**
     *
     * @deprecated
     * @returns
     */
    hasToJSON(obj: any): boolean {
        if (!obj) {
            return false;
        }

        if (typeof obj.toJSON === 'function' && typeof obj.getMonth !== 'function') {
            return true;
        }

        if (Array.isArray(obj)) {
            for (const v of obj) {
                if (this.hasToJSON(v)) {
                    return true;
                }
            }
        }

        if (!Array.isArray(obj) && typeof obj === 'object') {
            for (const k of Object.keys(obj)) {
                if (this.hasToJSON(obj[k])) {
                    return true;
                }
            }
        }
    }

    hasDataProperty(response): response is { data: any | any[] } {
        return !!response.data;
    }
}
