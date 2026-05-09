import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { CardBinErrors } from './card-bin.enums';

export class CardBinException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Card Bin Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get DecisionAlreadyMade() {
        return new this('Decision already made', CardBinErrors.DecisionAlreadyMade);
    }

    public static get DecisionInProgress() {
        return new this('Decision in progress', CardBinErrors.DecisionInProgress);
    }
}
