/**
 * The base Exception class
 */
import { AppStatus, Utils } from '@core/helpers';
import { HttpException } from '@nestjs/common';

export interface CustomExceptionJSON {
    code: string;
    message: string;
    error: any;
    data: any;
    stack?: string;
}

export class CustomException extends HttpException {
    private error;
    private code;
    private customMsg;
    private data;

    constructor(err: any, code: string, status: number, message: string, data?: any) {
        const customMsg = typeof err === 'string' ? err : message;
        super(customMsg, status);

        this.customMsg = customMsg;
        this.code = code;
        this.data = data;
        this.setError(err);
    }

    public setError(err) {
        this.error = err;
        return this;
    }

    public setData(data) {
        this.data = data;
        return this;
    }

    public getCode(): any {
        return this.code;
    }

    public getError(): any {
        return this.error;
    }

    public getMessage(): string {
        return this.customMsg;
    }

    public getData(): string {
        return this.data;
    }

    public setMessage(str) {
        this.customMsg = str;
        return this;
    }

    public toJSON(includeStack?: boolean): CustomExceptionJSON {
        const code = this.code ?? AppStatus.ApplicationError;
        const message = this.customMsg ?? 'Application Error';

        return Utils.removeNilValues({
            code,
            message,
            error: this.error,
            data: this.data,
            stack: includeStack ? this.stack : undefined,
        });
    }
}
