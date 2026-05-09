import { HttpService } from '@nestjs/axios';
import { Utils } from '@core/helpers';
import { ConfigService } from '@config/config.service';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { CommercialBank, IBankResolveIntegration, ResolvedAccount } from '@api/tools/banks/banks.interface';
import { AppException } from '@core/exceptions';
import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { PaymentStatus } from '@api/payments/payment.enums';
import { Payment } from '@api/payments/payment.schema';
import { HydratedDocument } from 'mongoose';
import { ITransferIntegration, ProcessorPaymentFinalStatusData } from './integrations.interfaces';

@Injectable()
export class FlutterwaveService implements IBankResolveIntegration, ITransferIntegration {
    public processor = TransactionProcessor.Flutterwave;

    constructor(private readonly config: ConfigService, private readonly http: HttpService) {}

    async getBankList(): Promise<CommercialBank[]> {
        const url = this.config.FLUTTERWAVE_URI.baseUrl + `/banks/NG`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.FLUTTERWAVE_URI.secret}`,
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));

            if (res.data.status == 'success' && Array.isArray(res.data.data)) {
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

    async resolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
        const url = this.config.FLUTTERWAVE_URI.baseUrl + `/accounts/resolve`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.FLUTTERWAVE_URI.secret}`,
            },
        };

        const data = {
            account_number: accountNumber,
            account_bank: bankCode,
        };

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));

            if (res.data.status == 'success') {
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

    async getStatus(payment: HydratedDocument<Payment>): Promise<ProcessorPaymentFinalStatusData> {
        const reference = payment.processorData.reference;

        const url = this.config.FLUTTERWAVE_URI.baseUrl + `/transfers/${reference}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.FLUTTERWAVE_URI.secret}`,
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));
            if (res.data.status === 'success' && res.data.data.status === 'SUCCESSFUL') {
                return { status: PaymentStatus.Success, data: res.data };
            }

            if (res.data.status && res.data.data.status === 'FAILED') {
                return { status: PaymentStatus.Failed, data: res.data };
            }

            return { status: PaymentStatus.Pending, data: res.data };
        } catch (e) {
            return { status: PaymentStatus.Pending };
        }
    }
}
