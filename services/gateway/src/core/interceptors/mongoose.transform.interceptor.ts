import { ClassSerializerInterceptor, PlainLiteralObject, Type } from '@nestjs/common';
import { ClassTransformOptions, plainToClass } from 'class-transformer';
import { Document } from 'mongoose';

export function MongooseSerializerInterceptor(classToIntercept: Type): typeof ClassSerializerInterceptor {
    return class Interceptor extends ClassSerializerInterceptor {
        private changePlainObjectToClass(document: PlainLiteralObject) {
            if (!(document instanceof Document)) {
                return document;
            }

            return plainToClass(classToIntercept, document.toJSON());
        }

        private prepareResponse(response: PlainLiteralObject | PlainLiteralObject[]) {
            if (Array.isArray(response)) {
                return response.map(this.changePlainObjectToClass);
            }

            if (response.data && !response._id) {
                response.data = this.prepareResponse(response.data);
                return response;
            }
            return this.changePlainObjectToClass(response);
        }

        serialize(response: PlainLiteralObject | PlainLiteralObject[], options: ClassTransformOptions) {
            return super.serialize(this.prepareResponse(response), options);
        }
    };
}
