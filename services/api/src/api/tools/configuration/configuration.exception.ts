import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { ConfigurationErrors } from './configuration.enums';

export class ConfigurationException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Product Setting Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get InvalidAccountType() {
        return new this('Invalid account type, main account required', ConfigurationErrors.InvalidAccountType);
    }
}
