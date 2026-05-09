import {
    IBankResolveIntegration,
    CommercialBank,
    ResolvedAccount,
    IBankSettlementIntegration,
    IProvidusCollectionTransaction,
    IProvidusCollectionEventBody,
} from '@api/tools/banks/banks.interface';
import { ConfigService } from '@config/config.service';
import { ModelIdTag, TagMongoId, Utils } from '@core/helpers';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BasicHash } from '@core/crypto/basic-hash';
import { AppException } from '@core/exceptions';
import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { PaymentStatus } from '@api/payments/payment.enums';
import { Payment } from '@api/payments/payment.schema';
import { HydratedDocument } from 'mongoose';
import {
    ICollectionAccountIntegration,
    ICollectionAccountResult,
    ISettlementAccountIntegration,
    ITransferIntegration,
    ProcessorPaymentFinalStatusData,
} from './integrations.interfaces';
import { ReporterService } from '@common/services/reporter.service';
import { VirtualAccountPartner } from '@api/account/account.enums';
import { RResponse } from '@common/services';

const PROVIDUS_BANK_CODE = '000023';
const PROVIDUS_BANK_NAME = 'PROVIDUS BANK';

const ProvidusPendingStatuses = {
    '01': 'Transaction does not exist',
    '06': 'DormantAccount',
    '09': 'RequestProcessingInProgress',
    '11': 'Reversal_Not_Successful',
    '14': 'Invalid Batch Number',
    '15': 'Invalid Session or Record ID',
    '17': 'Invalid Channel',
    '18': 'Wrong Method Call',
    '25': 'UnableToLocateRecord',
    '31': 'Reversal_Successful',
    '34': 'SuspectedFraud',
    '35': 'ContactSendingBank',
    '36': 'Transfer_Successful',
    '51': 'NoSufficientFunds',
    '68': 'ResponseReceivedTooLate',
    '69': 'Customer Details not successfully validated',
    '70': 'Notification not successfully received',
    '7706': 'Invalid Transaction Amount',
    '7709': 'Transaction Reference exists',
    '8004': 'Authentication Failed',
    '8803': 'No Connection',
    '909': 'Unknown_NFPCall_Response',
    '919': 'NUll_NFPCall_Response',
    '94': 'DuplicateTransaction',
    '95': 'Duplicate_payment_reference',
    '999': 'Local_Defined_TimeOut',
    '9999': 'NIP Authentication Failed',
};

export class ProvidusService
    implements
        IBankResolveIntegration,
        IBankSettlementIntegration,
        ITransferIntegration,
        ICollectionAccountIntegration,
        ISettlementAccountIntegration
{
    processor = TransactionProcessor.Providus;

    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
        private readonly reporter: ReporterService,
    ) {}

    async getBankList(): Promise<CommercialBank[]> {
        const url = this.config.PROVIDUS_THIRD_PARTY_URI.baseUrl + `/GetNIPBanks`;

        try {
            const res = await firstValueFrom(this.http.get(url));

            if (res.data.responseCode == '00' && Array.isArray(res.data.banks)) {
                return res.data.banks.map((v) => ({
                    code: v.bankCode,
                    name: v.bankName,
                }));
            }

            return [];
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    resolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
        if (bankCode == PROVIDUS_BANK_CODE) {
            return this.localResolveBankAccount(accountNumber);
        }
        return this.nipResolveBankAccount(accountNumber, bankCode);
    }

    async nipResolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
        const url = this.config.PROVIDUS_THIRD_PARTY_URI.baseUrl + `/GetNIPAccount`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const data = {
            accountNumber: accountNumber,
            beneficiaryBank: bankCode,
            userName: this.config.PROVIDUS_THIRD_PARTY_URI.id,
            password: this.config.PROVIDUS_THIRD_PARTY_URI.secret,
        };

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));

            if (res.data.responseCode == '00') {
                return {
                    name: Utils.toTitleCase(res.data.accountName),
                };
            }

            return null;
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async localResolveBankAccount(accountNumber: string): Promise<ResolvedAccount> {
        const url = this.config.PROVIDUS_THIRD_PARTY_URI.baseUrl + `/GetProvidusAccount`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const data = {
            accountNumber: accountNumber,
            userName: this.config.PROVIDUS_THIRD_PARTY_URI.id,
            password: this.config.PROVIDUS_THIRD_PARTY_URI.secret,
        };

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));

            if (res.data.responseCode == '00') {
                return {
                    name: Utils.toTitleCase(res.data.accountName),
                };
            }

            return null;
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async repushSettlement(data: any): Promise<string> {
        const url = this.config.PROVIDUS_SETTLEMENT_URI.baseUrl + `/PiP_RepushTransaction_SettlementId`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Client-Id': this.config.PROVIDUS_SETTLEMENT_URI.id,
                'X-Auth-Signature': BasicHash.hash(
                    `${this.config.PROVIDUS_SETTLEMENT_URI.id}:${this.config.PROVIDUS_SETTLEMENT_URI.secret}`,
                    'sha512',
                ),
            },
        };

        const body = {
            session_id: data.sessionId,
            settlement_id: data.settlementRef,
        };

        try {
            const res = await firstValueFrom(this.http.post(url, body, config));
            return res.data;
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async fetchSettlementTransaction(sessionId: string): Promise<IProvidusCollectionTransaction> {
        const url = this.config.PROVIDUS_SETTLEMENT_URI.baseUrl + `/PiPverifyTransaction?session_id=${sessionId}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Client-Id': this.config.PROVIDUS_SETTLEMENT_URI.id,
                'X-Auth-Signature': BasicHash.hash(
                    `${this.config.PROVIDUS_SETTLEMENT_URI.id}:${this.config.PROVIDUS_SETTLEMENT_URI.secret}`,
                    'sha512',
                ),
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));
            return res.data;
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async retriggerManualSettlement(sessionId: string): Promise<RResponse> {
        const transaction = await this.fetchSettlementTransaction(sessionId);

        const settledAmount = transaction.settledAmount.toFixed(2);
        const vatAmount = transaction.vatAmount.toFixed(2);
        const transactionAmount = transaction.transactionAmount.toFixed(2);

        const data: IProvidusCollectionEventBody = {
            sessionId: transaction.sessionId,
            settlementId: transaction.settlementId,
            accountNumber: transaction.accountNumber,
            sourceAccountNumber: transaction.sourceAccountNumber,
            sourceBankCode: transaction.sourceBankCode,
            sourceAccountName: transaction.sourceAccountName,
            sourceBankName: transaction.sourceBankName,
            channelId: transaction.channelId,
            tranDateTime: transaction.tranDateTime,
            initiationTranRef: transaction.initiationTranRef,
            tranRemarks: transaction.tranRemarks,
            settledAmount: settledAmount,
            vatAmount: vatAmount,
            currency: transaction.currency,
            transactionAmount: transactionAmount,
        };

        const url = this.config.WEBHOOK_SERVICE_LIVE_URL + '/providus/collection';

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Client-Id': this.config.PROVIDUS_SETTLEMENT_URI.id,
                'X-Auth-Signature': BasicHash.hash(
                    `${this.config.PROVIDUS_SETTLEMENT_URI.id}:${this.config.PROVIDUS_SETTLEMENT_URI.secret}`,
                    'sha512',
                ),
            },
        };

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));
            return res;
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    getStatus(payment: HydratedDocument<Payment>): Promise<ProcessorPaymentFinalStatusData> {
        if (payment.methodData?.bankTransfer?.bankCode == PROVIDUS_BANK_CODE) {
            return this.getLocalTransactionStatus(payment);
        }
        return this.getNIPTransactionStatus(payment);
    }

    async getLocalTransactionStatus(payment: HydratedDocument<Payment>): Promise<ProcessorPaymentFinalStatusData> {
        const reference = payment.processorData?.reference ?? TagMongoId(ModelIdTag.Payment, payment.id);
        const url = this.config.PROVIDUS_THIRD_PARTY_URI.baseUrl + `/GetProvidusTransactionStatus`;
        const config = { headers: { 'Content-Type': 'application/json' } };

        const data = {
            transactionReference: reference,
            userName: this.config.PROVIDUS_THIRD_PARTY_URI.id,
            password: this.config.PROVIDUS_THIRD_PARTY_URI.secret,
        };

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));
            if (res.data.responseCode == '00') {
                return { status: PaymentStatus.Success, data: res.data };
            }

            if (ProvidusPendingStatuses[res.data.responseCode]) {
                return { status: PaymentStatus.Pending, data: res.data };
            }

            return { status: PaymentStatus.Failed, data: res.data };
        } catch (e) {
            return { status: PaymentStatus.Pending, error: e };
        }
    }

    async getNIPTransactionStatus(payment: HydratedDocument<Payment>): Promise<ProcessorPaymentFinalStatusData> {
        const reference = payment.processorData?.reference ?? TagMongoId(ModelIdTag.Payment, payment.id);

        const url = this.config.PROVIDUS_THIRD_PARTY_URI.baseUrl + `/GetNIPTransactionStatus`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const data = {
            transactionReference: reference,
            userName: this.config.PROVIDUS_THIRD_PARTY_URI.id,
            password: this.config.PROVIDUS_THIRD_PARTY_URI.secret,
        };

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));
            if (res.data.responseCode == '00') {
                return { status: PaymentStatus.Success, data: res.data };
            }

            if (ProvidusPendingStatuses[res.data.responseCode]) {
                return { status: PaymentStatus.Pending, data: res.data };
            }

            return { status: PaymentStatus.Failed, data: res.data };
        } catch (e) {
            return { status: PaymentStatus.Pending, error: e };
        }
    }

    async updateDepositChannel(accountNumber: string, accountName: string): Promise<string> {
        accountName = accountName.trim();
        accountName = accountName.length > 30 ? accountName.substring(0, 30) : accountName;

        const url = this.config.PROVIDUS_SETTLEMENT_URI.baseUrl + `/PiPUpdateAccountName`;

        const secret = `${this.config.PROVIDUS_SETTLEMENT_URI.id}:${this.config.PROVIDUS_SETTLEMENT_URI.secret}`;
        const signature = BasicHash.hash(secret, 'sha512');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Client-Id': this.config.PROVIDUS_SETTLEMENT_URI.id,
                'X-Auth-Signature': signature,
            },
        };

        const data = {
            account_number: accountNumber,
            account_name: accountName,
        };

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));
            if (res.data.responseCode == '00') {
                return accountName;
            }
            return null;
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async createDepositChannel(name: string, dynamic: boolean): Promise<ICollectionAccountResult> {
        const baseUrl = this.config.PROVIDUS_SETTLEMENT_URI.baseUrl;
        const url = dynamic ? baseUrl + `/PiPCreateDynamicAccountNumber` : baseUrl + `/PiPCreateReservedAccountNumber`;

        const secret = `${this.config.PROVIDUS_SETTLEMENT_URI.id}:${this.config.PROVIDUS_SETTLEMENT_URI.secret}`;
        const signature = BasicHash.hash(secret, 'sha512');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Client-Id': this.config.PROVIDUS_SETTLEMENT_URI.id,
                'X-Auth-Signature': signature,
            },
        };

        const data = {
            account_name: name,
            bvn: '',
        };

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));
            if (res.data.responseCode == '00') {
                return {
                    accountNumber: res.data.account_number,
                    accountName: res.data.account_name,
                    bankName: PROVIDUS_BANK_NAME,
                    bankCode: PROVIDUS_BANK_CODE,
                    partner: VirtualAccountPartner.Providus,
                };
            }
            return null;
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    async getSettlementAccountBalance(): Promise<number> {
        const url = this.config.PROVIDUS_THIRD_PARTY_URI.baseUrl + `/GetProvidusAccount`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const data = {
            userName: this.config.PROVIDUS_THIRD_PARTY_URI.id,
            password: this.config.PROVIDUS_THIRD_PARTY_URI.secret,
            beneficiaryBank: PROVIDUS_BANK_CODE,
            accountNumber: this.config.PROVIDUS_SETTLEMENT_ACCOUNT_NUMBER,
        };

        try {
            const res = await firstValueFrom(this.http.post(url, data, config));
            if (res.data.responseCode == '00') {
                const balance = parseFloat(res.data.availableBalance);
                return balance * 100;
            }
            throw AppException.ServiceUnavailable.setError(res.data);
        } catch (e) {
            if (e instanceof AppException) {
                throw e;
            }
            throw AppException.ServiceUnavailable.setError(e);
        }
    }
}
