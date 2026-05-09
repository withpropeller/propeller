import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { classToPlain } from 'class-transformer';
import { isArray, isObject } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PlainLiteralObject {
    [key: string]: any;
}

@Injectable()
export class ModelTransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next
            .handle()
            .pipe(
                map((res: PlainLiteralObject | PlainLiteralObject[]) =>
                    isObject(res) || isArray(res) ? this.mapViewModel(res, []) : res,
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
        if (plainOrClass instanceof Document) {
            return plainOrClass;
        }

        if (plainOrClass && plainOrClass.constructor) {
            return classToPlain(plainOrClass, { groups: roles });
        }
    }

    hasDataProperty(response): response is { data: any | any[] } {
        return !!response.data;
    }
}
