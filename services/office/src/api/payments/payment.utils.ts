import { PaymentTimelineAction } from './payment.enums';
import { Payment } from './payment.schema';

export function isMarkedAsDebited(payment: Payment): boolean {
    const timeline = payment.timeline.find((tl) => tl.action == PaymentTimelineAction.FundsDebited);
    return timeline !== undefined;
}
