import { Module } from '@nestjs/common';
import { PaymentRequestController } from './payment-requests.controller';
import { PaymentRequestService } from './payment-requests.service';
import { CommonModule } from '@common/common.module';

@Module({
    imports: [CommonModule],
    controllers: [PaymentRequestController],
    providers: [PaymentRequestService],
})
export class PaymentRequestModule {}
