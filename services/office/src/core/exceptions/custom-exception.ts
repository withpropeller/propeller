/**
 * The base Exception class
 */
import { HttpException } from '@nestjs/common';
import { ICustomException } from './custom.exception.interface';

export class CustomException extends HttpException implements ICustomException {
    public error;
    public code;
    public message;
    public data;

    constructor(err: any, code: string, status: number, message: string, data?: any) {
        const customMsg = typeof err === 'string' ? err : message;
        super(customMsg, status);

        this.message = customMsg;
        this.code = code;
        this.data = data;
        this.setError(err);
    }

    public setError(err) {
        if (typeof err !== 'string') {
            this.error = err;
        }
        return this;
    }

    public getCode(): any {
        return this.code;
    }

    public getError(): any {
        return this.error;
    }

    public getMessage(): string {
        return this.message;
    }

    public getData(): string {
        return this.data;
    }

    public setMessage(str) {
        this.message = str;
        return this;
    }
}
