import { HttpException } from '@nestjs/common';
import { AppStatus } from '../helpers/enums.js';
import { Utils } from '../helpers/utils.js';

export interface CustomExceptionJSON {
  code: string;
  message: string;
  error: unknown;
  data: unknown;
  stack?: string;
}

export class CustomException extends HttpException {
  private error: unknown;
  private code: string;
  private customMsg: string;
  private data: unknown;

  constructor(err: unknown, code: string, status: number, message: string, data?: unknown) {
    const customMsg = typeof err === 'string' ? err : message;
    super(customMsg, status);
    this.customMsg = customMsg;
    this.code = code;
    this.data = data;
    this.error = err;
  }

  public setError(err: unknown): this {
    this.error = err;
    return this;
  }

  public setData(data: unknown): this {
    this.data = data;
    return this;
  }

  public getCode(): string {
    return this.code;
  }

  public getError(): unknown {
    return this.error;
  }

  public getMessage(): string {
    return this.customMsg;
  }

  public getData(): unknown {
    return this.data;
  }

  public setMessage(str: string): this {
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
    }) as CustomExceptionJSON;
  }
}
