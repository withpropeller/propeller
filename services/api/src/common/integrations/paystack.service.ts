import { HttpService } from '@nestjs/axios';
import { Utils } from '@core/helpers';
import { ConfigService } from '@config/config.service';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { AppException } from '@core/exceptions';
import { CommercialBank, IBankResolveIntegration, ResolvedAccount } from '@api/tools/banks/banks.interface';
import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { INibssDirectDebitIntegration } from './integrations.interfaces';
import { PaymentRequest, PaymentRequestProcessorData } from '@api/payment-requests/payment-request.schema';
import { ExecutionOptions, ExecutionOptionsWithRequest } from '@common/interfaces';
import { TagMongoId, ModelIdTag } from '@core/mongo';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class PaystackService implements IBankResolveIntegration, INibssDirectDebitIntegration {
    public processor = TransactionProcessor.Paystack;

    constructor(private readonly config: ConfigService, private readonly http: HttpService) {}

    async resolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
        const url = this.config.PAYSTACK_URI_LIVE.baseUrl + `/bank/resolve`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.PAYSTACK_URI_LIVE.secret}`,
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
                    name: res.data.data.account_name,
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
        const url = this.config.PAYSTACK_URI_LIVE.baseUrl + `/bank?currency=NGN`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.PAYSTACK_URI_LIVE.secret}`,
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));

            if (res.data.status && Array.isArray(res.data.data)) {
                return res.data.data.map((v) => ({ code: v.code, name: v.name }));
            }

            return [];
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async createMandate(
        email: string,
        callbackUrl?: string,
        options?: ExecutionOptionsWithRequest,
    ): Promise<Record<string, any>> {
        if (options?.dryRun) {
            return {
                customerEmail: email,
                reference: 'some-reference',
                returnUrl: 'https://paystack.com',
                requests: [],
            };
        }
        const credentials = this.config.PAYSTACK_URI(options?.request);
        const url = credentials.baseUrl + `/customer/authorization/initialize`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${credentials.secret}`,
            },
        };

        const data = Utils.removeNilValues({
            email,
            channel: 'direct_debit',
            callback_url: callbackUrl,
        });

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));
            if (res.data.status) {
                return {
                    customerEmail: email,
                    reference: res.data.data.reference,
                    returnUrl: res.data.data.redirect_url,
                    requests: [{ requestBody: JSON.stringify(data), responseBody: JSON.stringify(res.data) }],
                };
            }
            return null;
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async revokeMandate(authCode: string, options?: ExecutionOptions): Promise<boolean> {
        if (options?.dryRun) {
            return true;
        }
        const credentials = this.config.PAYSTACK_URI(options?.request);
        const url = credentials.baseUrl + `/customer/authorization/deactivate`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${credentials.secret}`,
            },
        };

        const data = Utils.removeNilValues({
            authorization_code: authCode,
        });

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));
            if (res.data.status && res.data.data.status === 'success') {
                return true;
            }
            return false;
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async chargeMandate(
        paymentAuth: Record<string, any>,
        paymentRequest: HydratedDocument<PaymentRequest>,
        options: ExecutionOptionsWithRequest,
    ): Promise<PaymentRequestProcessorData> {
        const reference = TagMongoId(ModelIdTag.PaymentRequest, paymentRequest.id);
        if (options?.dryRun) {
            return {
                reference,
                requests: [],
            };
        }

        const credentials = this.config.PAYSTACK_URI(options.request);
        const url = credentials.baseUrl + `/transaction/charge_authorization`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${credentials.secret}`,
            },
        };

        const data = Utils.removeNilValues({
            amount: paymentRequest.amount.toFixed(),
            currency: paymentRequest.currency,
            email: paymentAuth.processorData.customerEmail,
            reference: reference,
            authorization_code: paymentAuth.processorData.authCode,
        });

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));
            if (res.data.status && res.data.data.status === 'success') {
                return {
                    reference: res.data.data.reference,
                    requests: [{ requestBody: JSON.stringify(data), responseBody: JSON.stringify(res.data) }],
                };
            }
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }
}
