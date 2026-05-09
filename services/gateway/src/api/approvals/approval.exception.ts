import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { ApprovalErrors } from './approval.enums';

export class ApprovalException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Approval Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get Processing() {
        return new this(
            'Approval is being processed',
            ApprovalErrors.ApprovalUnavailable,
            HttpStatus.BAD_REQUEST,
        );
    }

    public static get DecisionAlreadyMade() {
        return new this(
            'Decision already made',
            ApprovalErrors.ApprovalUnavailable,
            HttpStatus.BAD_REQUEST,
        );
    }

    public static get Pending() {
        return new this(
            'Previous approval is still pending',
            ApprovalErrors.ApprovalIsPending,
            HttpStatus.BAD_REQUEST,
        );
    }
}
