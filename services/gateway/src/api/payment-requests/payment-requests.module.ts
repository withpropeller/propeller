import { Module } from '@nestjs/common';
import { PaymentRequestController } from './payment-requests.controller';
import { PaymentRequestService } from './payment-requests.service';

@Module({
    imports: [],
    controllers: [PaymentRequestController],
    providers:  [PaymentRequestService],
})
export class PaymentRequestModule {}
