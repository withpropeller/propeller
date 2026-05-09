import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { CardProgramErrors } from './card-program.enums';

export class CardProgramException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Card Program Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get CardProgramApprovalUnavailable() {
        return new this('Card Program Approval Unavailable', CardProgramErrors.ApprovalUnavailable);
    }

    public static get CardProductionQuantityExceeded() {
        return new this('Card Quantity Exceeded', CardProgramErrors.CardProductionQuantityExceeded);
    }

    public static get DecisionAlreadyMade() {
        return new this('Decision already made', CardProgramErrors.DecisionAlreadyMade);
    }

    public static get DecisionInProgress() {
        return new this('Decision in progress', CardProgramErrors.DecisionInProgress);
    }

    public static get ProductionInProgress() {
        return new this('Production in progress', CardProgramErrors.ProductionInProgress);
    }

    public static get CardProgramNotApproved() {
        return new this('Card Program Not Approved', CardProgramErrors.CardProgramNotApproved);
    }

    public static get CardProgramNotInApprovedState() {
        return new this('Card Program Not in Approved State', CardProgramErrors.CardProgramNotInApprovedState);
    }

    public static get CardProgramNotLive() {
        return new this('Card Program Not Live', CardProgramErrors.CardProgramNotLive);
    }

    public static get AlreadyWentLive() {
        return new this('Card Program Already went live', CardProgramErrors.CardProgramAlreadyWentLive);
    }

    public static get CardPanNotFound() {
        return new this('Card Pan Not Found', CardProgramErrors.CardPanNotFound);
    }

    public static get CardAuthorizationEventsRequired() {
        return new this(
            'All Card Authorization Events are required, requires `card.authorization.request`, `card.authorization.closed` and `card.authorization.update`',
            CardProgramErrors.CardAuthorizationEventRequired,
        );
    }

    public static get CardProgramNotPersonalized() {
        return new this(
            'Card batches must be requested for Providus before going live',
            CardProgramErrors.CardProgramNotPersonalized,
        );
    }
}
