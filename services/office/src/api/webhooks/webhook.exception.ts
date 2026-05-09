import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { WebhookErrors } from './webhook.enums';

export class WebhookException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Webhook Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get NoWebhookFound() {
        return new this('No webhook found', WebhookErrors.NoWebhookFound);
    }

    public static get WebhookUrlAlreadyExists() {
        return new this('Webhook URL already exists', WebhookErrors.WebhookUrlAlreadyExists);
    }

    public static get WebhookEventsConflict() {
        return new this('Webhook event conflict', WebhookErrors.WebhookEventsConflict);
    }
}
