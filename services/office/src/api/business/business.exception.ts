import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { BusinessErrors } from './business.enums';

export class BusinessException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Business Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get BusinessApprovalUnavailable() {
        return new this('Business Approval Unavailable', BusinessErrors.BusinessApprovalUnavailable);
    }

    public static get BusinessNotApproved() {
        return new this('Business Not Approved', BusinessErrors.BusinessNotApproved);
    }

    public static get KycNotCompleted() {
        return new this('Business KYC Not Completed', BusinessErrors.KycNotCompleted);
    }
}
