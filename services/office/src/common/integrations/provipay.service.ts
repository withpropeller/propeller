import { ConfigService } from '@config/config.service';
import { ModelIdTag, TagMongoId, TenantDataSource } from '@core/helpers';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AppException } from '@core/exceptions';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Payment } from '@api/payments/payment.schema';
import { HydratedDocument } from 'mongoose';
import { PaymentStatus } from '@api/payments/payment.enums';
import { ProcessorPaymentFinalStatusData } from './integrations.interfaces';

export class ProvipayService {
    constructor(
        @Inject(REQUEST) protected request: TenantRequestPayload,
        private readonly config: ConfigService,
        private readonly http: HttpService,
    ) {}

    async getStatus(
        tenant: TenantDataSource,
        payment: HydratedDocument<Payment>,
    ): Promise<ProcessorPaymentFinalStatusData> {
        if (tenant != TenantDataSource.Live) {
            return { status: PaymentStatus.Success };
        }

        const reference = payment.processorData?.reference ?? TagMongoId(ModelIdTag.Payment, payment.id);

        const uri = this.config.PROVIPAY_URI(this.request);
        const url = uri.baseUrl + `/makepayment/enquiry?txn_ref=${reference}`;
        const token = `${uri.id}:${uri.secret}`;
        const encodedToken = Buffer.from(token).toString('base64');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${encodedToken}`,
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));
            if (res.data.status == 'successful') {
                return { status: PaymentStatus.Success, data: res.data };
            }

            return { status: PaymentStatus.Failed, data: res.data };
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }
}
