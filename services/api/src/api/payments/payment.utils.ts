import { Business } from '@models/business/business.schema';
import { subMinutes } from 'date-fns';
import { HydratedDocument } from 'mongoose';
import { CreatePayoutPaymentDto } from './payment.dto';
import { PaymentTimelineAction, PaymentType } from './payment.enums';
import { PaymentException } from './payment.exception';
import { Payment } from './payment.schema';
import { Repository } from '@core/abstracts';

export async function ensureNoDuplicatePayment(
    repo: Repository<Payment>,
    business: HydratedDocument<Business>,
    data: CreatePayoutPaymentDto,
) {
    if (data.options.bypassDuplicateCheck) {
        return;
    }

    // Check if similar payment in the last 5 minutes exists to prevent duplicate payments
    const recentPayment = await repo.findOne(
        {
            business: business.id,
            type: PaymentType.PayOut,
            amount: data.amount,
            'methodData.bankTransfer.accountNumber': data.options.accountNumber,
            createdAt: { $gte: subMinutes(new Date(), 5) },
        },
        true,
        'id',
    );
    if (recentPayment) {
        throw PaymentException.DuplicatePayment;
    }
}

export function isPaymentFundsDebited(payment: HydratedDocument<Payment>) {
    const timeline = payment.timeline ?? [];
    return timeline.some((t) => t.action === PaymentTimelineAction.FundsDebited);
}
