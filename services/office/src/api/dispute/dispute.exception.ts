import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { DisputeErrors } from './dispute.enums';

export class DisputeException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Dispute Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    static get InvalidSourceType() {
        return new this('Invalid source type', DisputeErrors.InvalidSourceType);
    }

    static get DuplicateDispute() {
        return new this('Duplicate dispute', DisputeErrors.DuplicateDispute);
    }

    static get InvalidDisputeStatus() {
        return new this('Invalid dispute status', DisputeErrors.InvalidDisputeStatus);
    }

    static get CannotRefundDispute() {
        return new this('Cannot refund dispute', DisputeErrors.CannotRefundDispute);
    }

    static get RefundBalanceInsufficient() {
        return new this('Dispute Refund Balance Insufficient', DisputeErrors.RefundBalanceInsufficient);
    }
}
