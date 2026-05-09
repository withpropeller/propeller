import { HttpService } from '@nestjs/axios';
import { ModelIdTag, TagMongoId, Utils } from '@core/helpers';
import { ConfigService } from '@config/config.service';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { AppException } from '@core/exceptions';
import { CommercialBank, IBankResolveIntegration, ResolvedAccount } from '@api/tools/banks/banks.interface';
import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { PaymentStatus } from '@api/payments/payment.enums';
import { Payment } from '@api/payments/payment.schema';
import { HydratedDocument } from 'mongoose';
import {
    ISettlementAccountIntegration,
    ITransferIntegration,
    ProcessorPaymentFinalStatusData,
} from './integrations.interfaces';
import { ReporterService } from '@common/services/reporter.service';

@Injectable()
export class PaystackService implements IBankResolveIntegration, ITransferIntegration, ISettlementAccountIntegration {
    public processor = TransactionProcessor.Paystack;

    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
        private readonly reporter: ReporterService,
    ) {}

    async resolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
        const url = this.config.PAYSTACK_URI.baseUrl + `/bank/resolve`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.PAYSTACK_URI.secret}`,
            },
            params: {
                account_number: accountNumber,
                bank_code: bankCode,
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));

            if (res.data.status) {
                return {
                    name: Utils.toTitleCase(res.data.data.account_name),
                };
            }

            return null;
        } catch (e) {
            if (Utils.isStatusCodeBad(e.response.status)) {
                return null;
            }

            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async getBankList(): Promise<CommercialBank[]> {
        const url = this.config.PAYSTACK_URI.baseUrl + `/bank?currency=NGN`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.PAYSTACK_URI.secret}`,
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));

            if (res.data.status && Array.isArray(res.data.data)) {
                return res.data.data.map((v) => ({
                    code: v.code,
                    name: v.name,
                }));
            }

            return [];
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async getStatus(payment: HydratedDocument<Payment>): Promise<ProcessorPaymentFinalStatusData> {
        const reference = TagMongoId(ModelIdTag.Payment, payment.id).replace('.', '-').toLowerCase();
        const url = this.config.PAYSTACK_URI.baseUrl + `/transfer/verify/${reference}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.PAYSTACK_URI.secret}`,
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));

            if (res.data.status && res.data.data.status === 'success') {
                return { status: PaymentStatus.Success, data: res.data };
            }

            if (res.data.status && res.data.data.status === 'failed') {
                return { status: PaymentStatus.Failed, data: res.data };
            }

            return { status: PaymentStatus.Pending, data: res.data };
        } catch (e) {
            if (e.response.data && e.response.data.code == 'not_found') {
                return { status: PaymentStatus.Failed, data: e.response.data };
            }
            return { status: PaymentStatus.Pending, data: e.response.data };
        }
    }

    async getSettlementAccountBalance(): Promise<number> {
        const url = this.config.PAYSTACK_URI.baseUrl + `/balance`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.PAYSTACK_URI.secret}`,
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));

            if (res.data.status && Array.isArray(res.data.data)) {
                return res.data.data[0].balance;
            }

            throw AppException.ServiceUnavailable.setError(res.data);
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }
}
