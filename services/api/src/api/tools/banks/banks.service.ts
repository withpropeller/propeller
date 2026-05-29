import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { ConfigService } from '@config/config.service';
import { RedisKeys, TenantDataSource } from '@core/helpers';
import { FloService, floDecodeJson } from '@core/services/flo.service';
import { HttpService } from '@nestjs/axios';
import { BankAccountChecksum } from './banks.helpers';
import { ITransferSettings, ResolveBankAccountDto } from './banks.dto';
import {
    CommercialBank,
    IBankResolveIntegration,
    ITransferBreakdown,
    ProcessorBankMapping,
    ResolvedAccount,
} from './banks.interface';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { PROVIDUS_BANK_CODE } from '@common/helpers/constants';
import { HydratedDocument } from 'mongoose';
import { Fee, FeeBreakdownType, FeeGroup, FeeStructure } from '@api/fees/fee.schema';
import Big from 'big.js';
import { PaystackService } from '@common/integrations/paystack.service';
import { PaymentException } from '@api/payments/payment.exception';
import * as retry from 'async-retry';
import { ReporterService } from '@core/services';
import { PaymentErrors } from '@api/payments/payment.enums';
import { REQUEST } from '@nestjs/core';
import { GetTenantDataSource, TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';

const ALLAWEE_SANDBOX_ACCOUNT_NAME = 'CIROMA CHUKWUMA ADEKUNLE';
const ALLAWEE_SANDBOX_BANK_CODE = '000';
const ALLAWEE_SANDBOX_BANK_NAME = 'Allawee Sandbox Bank';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class TransferService {
    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private readonly config: ConfigService,
        private readonly http: HttpService,
        private flo: FloService,
        private reporter: ReporterService,
    ) {}

    async getMainTransferSettings(): Promise<ITransferSettings> {
        return floDecodeJson<ITransferSettings>(
            (await this.flo.client.kv.jsonGet(RedisKeys.MainTransferSettings, '$'))?.value ?? null,
        );
    }

    async getBackupTransferSettings(): Promise<ITransferSettings> {
        return floDecodeJson<ITransferSettings>(
            (await this.flo.client.kv.jsonGet(RedisKeys.BackupTransferSettings, '$'))?.value ?? null,
        );
    }

    async getBankList(): Promise<CommercialBank[]> {
        let bankRecords = floDecodeJson<Record<string, CommercialBank>>(
            (await this.flo.client.kv.jsonGet(RedisKeys.BankSettings, '$'))?.value ?? null,
        );
        bankRecords = bankRecords || {};

        const banks = Object.values(bankRecords);
        return banks.sort((a, b) => {
            if (a.name > b.name) return 1;
            if (a.name < b.name) return -1;
            return 0;
        });
    }

    async getShortBankList(accountNumber: string): Promise<CommercialBank[]> {
        let banks = await this.getBankList();

        const processor = TransactionProcessor.Paystack;
        let mappings = floDecodeJson<Record<string, ProcessorBankMapping>>(
            (await this.flo.client.kv.jsonGet(`${RedisKeys.BankMappingsSettings}:${processor}`, '$'))?.value ?? null,
        );
        mappings = mappings || {};

        banks = banks.map((v) => {
            const map = mappings[v.code];
            if (map) {
                v.processorCode = map.processorCode;
            }
            return v;
        });

        return BankAccountChecksum.resolveShortList(accountNumber, banks);
    }

    async getBankWithCode(code: string): Promise<CommercialBank> {
        const banks = await this.getBankList();
        return banks.find((v) => v.code == code);
    }

    async getProcessorBankCode(code: string, processor: string): Promise<string> {
        if (processor == TransactionProcessor.Providus) {
            return code;
        }

        let mappings = floDecodeJson<Record<string, ProcessorBankMapping>>(
            (await this.flo.client.kv.jsonGet(`${RedisKeys.BankMappingsSettings}:${processor}`, '$'))?.value ?? null,
        );
        mappings = mappings || {};

        const mapping = Object.values(mappings);

        const map = mapping.find((v) => v.code == code);
        if (map) {
            return map.processorCode;
        }

        throw PaymentException.InvalidBankCode;
    }

    private getIntegration(processor?: TransactionProcessor): IBankResolveIntegration {
        return new PaystackService(this.config, this.http);
    }

    getSettlementIntegration(): PaystackService {
        return new PaystackService(this.config, this.http);
    }

    async resolveBankAccount(data: ResolveBankAccountDto): Promise<[ResolvedAccount, ITransferSettings]> {
        const dataSource = GetTenantDataSource(this.request);
        if (data.bankCode == ALLAWEE_SANDBOX_BANK_CODE && dataSource === TenantDataSource.Sandbox) {
            return [
                {
                    name: ALLAWEE_SANDBOX_ACCOUNT_NAME,
                    bank: {
                        name: ALLAWEE_SANDBOX_BANK_NAME,
                        code: ALLAWEE_SANDBOX_BANK_CODE,
                        abbr: 'ASB',
                        rank: 0,
                        imageUrl: 'https://hyphen-cdn.s3.eu-west-1.amazonaws.com/bank-logos/default.png',
                    },
                },
                null,
            ];
        }

        try {
            const transferSettings = await this.getMainTransferSettings();
            const integration = this.getIntegration(transferSettings.processor);
            const resolved = await this._resolveBankAccount(data, integration);
            if (resolved && resolved.name) {
                return [resolved, transferSettings];
            }
            throw PaymentException.BankAccountNotFound;
        } catch (e) {
            if (e.code == PaymentErrors.BankAccountNotFound) {
                throw e;
            }

            const transferSettings = await this.getBackupTransferSettings();
            const integration = this.getIntegration(transferSettings.processor);
            const resolved = await this._resolveBankAccount(data, integration);
            if (!resolved) {
                throw PaymentException.BankAccountNotFound;
            }
            return [resolved, transferSettings];
        }
    }

    private async _resolveBankAccount(
        data: ResolveBankAccountDto,
        integration: IBankResolveIntegration,
    ): Promise<ResolvedAccount> {
        try {
            const resolved = await retry(
                async () => {
                    const bankCode = await this.getProcessorBankCode(data.bankCode, integration.processor);
                    const bank = await this.getBankWithCode(data.bankCode);
                    const resolvedAccount = await integration.resolveBankAccount(data.accountNumber, bankCode);
                    return { ...resolvedAccount, bank };
                },
                { retries: 3 },
            );

            return resolved;
        } catch (e) {
            this.reporter.pushInfo({
                message: `${integration.processor} processor failed resolve bank account name`,
                context: 'TransferService.getBankAccountName',
            });

            throw e;
        }
    }

    async getTransferBreakdown(
        bankCode: string,
        accountNumber: string,
        amount: number,
        transferFee?: HydratedDocument<Fee>,
    ): Promise<ITransferBreakdown> {
        const [resolvedAccount, transferSettings] = await this.resolveBankAccount({ bankCode, accountNumber });

        const feesBreakdown: ITransferBreakdown = {
            totalFees: 0,
            feesBreakdown: [],
            processor: transferSettings.processor,
            resolvedAccount,
        };

        if (transferFee) {
            const transferFeeAmount = this.calculateFeeAmount(amount, transferFee);
            feesBreakdown.totalFees += transferFeeAmount;
            feesBreakdown.feesBreakdown.push({
                type: FeeBreakdownType.BankTransfer,
                group: FeeGroup.Custom,
                fee: transferFee.id,
                amount: transferFeeAmount,
            });
        }

        if (transferSettings?.processor == TransactionProcessor.Providus && bankCode == PROVIDUS_BANK_CODE) {
            return feesBreakdown;
        }

        const tiers = transferSettings.feeTiers.sort((a, b) => {
            if (a.limit > b.limit) return -1;
            if (a.limit < b.limit) return 1;
            return 0;
        });

        for (const tier of tiers) {
            if (amount >= tier.limit) {
                feesBreakdown.totalFees += tier.fee;
                feesBreakdown.feesBreakdown.push({
                    group: FeeGroup.Partner,
                    type: FeeBreakdownType.NIP,
                    amount: tier.fee,
                });
                return feesBreakdown;
            }
        }

        return feesBreakdown;
    }

    calculateFeeAmount(amount: number, fee: HydratedDocument<Fee>, decimalPoints = 0): number {
        if (fee?.structure == FeeStructure.Flat) {
            return fee.value;
        }

        if (fee?.structure == FeeStructure.Percentage) {
            const val = Big(fee.value).div(100).times(amount).round(decimalPoints);

            if (fee.cap != 0 && val.toNumber() > fee.cap) {
                return fee.cap;
            }

            return val.toNumber();
        }

        return null;
    }
}
