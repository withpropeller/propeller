import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { ProvidusService } from '@common/integrations/providus.service';
import { ConfigService } from '@config/config.service';
import { RedisKeys, TenantDataSource } from '@core/helpers';
import { RedisService } from '@core/services/redis.service';
import { HttpService } from '@nestjs/axios';
import { BankAccountChecksum } from './banks.helpers';
import { AddBankListDto, ProcessorBanksMapsDto, ResolveBankAccountDto } from './banks.dto';
import {
    CommercialBank,
    IBankResolveIntegration,
    ITransferBreakdown,
    ITransferSettings,
    ProcessorBankMapping,
    ResolvedAccount,
} from './banks.interface';
import { Injectable } from '@nestjs/common';
import { PROVIDUS_BANK_CODE } from '@common/helpers/constants';
import { HydratedDocument } from 'mongoose';
import { Fee, FeeBreakdownType, FeeGroup, FeeStructure } from '@api/fees/fee.schema';
import Big from 'big.js';
import { PaymentException } from '@api/payments/payment.exception';
import { FlutterwaveService } from '@common/integrations/flutterwave.service';
import { PaystackService } from '@common/integrations/paystack.service';
import * as retry from 'async-retry';
import { ReporterService } from '@common/services/reporter.service';
import { PaymentErrors, PaymentStatus } from '@api/payments/payment.enums';
import { Payment } from '@api/payments/payment.schema';
import { ITransferIntegration, ProcessorPaymentFinalStatusData } from '@common/integrations/integrations.interfaces';
import { StorageService } from '@common/services/storage.service';

@Injectable()
export class TransferService {
    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
        private redisService: RedisService,
        private reporter: ReporterService,
        private storageService: StorageService,
    ) {}

    async getTransferSettings(): Promise<ITransferSettings> {
        return this.redisService.jsonGet(RedisKeys.TransferSettings);
    }

    async addBankList(body: AddBankListDto) {
        let bankRecords = await this.redisService.jsonGet<CommercialBank[]>(`${RedisKeys.BankSettings}`);
        bankRecords = bankRecords || [];

        for (const bank of body.banks) {
            if (!bank.imageUrl) {
                continue;
            }
            const awsDoc = await this.storageService.uploadViaUrl(`bank-logos`, bank.imageUrl);
            bank.imageUrl = awsDoc.url;
        }

        const banksToUpdate = body.banks.reduce((prev, curr) => ({ ...prev, [curr.code]: curr }), {});
        const update = { ...bankRecords, ...banksToUpdate };

        await this.redisService.jsonSet(`${RedisKeys.BankSettings}`, update);
    }

    async mapProcessorBanks(body: ProcessorBanksMapsDto) {
        let mappings = await this.redisService.jsonGet<Record<string, CommercialBank>>(
            `${RedisKeys.BankMappingsSettings}:${body.processor}`,
        );
        mappings = mappings || {};

        const mapsToUpdate = body.mappings.reduce((prev, curr) => ({ ...prev, [curr.code]: curr }), {});
        const update = { ...mappings, ...mapsToUpdate };

        await this.redisService.jsonSet(`${RedisKeys.BankMappingsSettings}:${body.processor}`, update);
    }

    async getBankList(): Promise<CommercialBank[]> {
        let bankRecords = await this.redisService.jsonGet<Record<string, CommercialBank>>(RedisKeys.BankSettings);
        bankRecords = bankRecords || {};

        const arr = Object.values(bankRecords);
        return arr.sort((a, b) => {
            if (a.name > b.name) return 1;
            if (a.name < b.name) return -1;
            return 0;
        });
    }

    async getBankMappings(processor: TransactionProcessor) {
        let mappings = await this.redisService.jsonGet<Record<string, CommercialBank>>(
            `${RedisKeys.BankMappingsSettings}:${processor}`,
        );
        mappings = mappings || {};

        const arr = Object.values(mappings);
        return arr.sort((a, b) => {
            if (a.code > b.code) return 1;
            if (a.code < b.code) return -1;
            return 0;
        });
    }

    async getShortBankList(accountNumber: string): Promise<CommercialBank[]> {
        let banks = await this.getBankList();

        const processor = TransactionProcessor.Paystack;
        let mappings = await this.redisService.jsonGet<Record<string, ProcessorBankMapping>>(
            `${RedisKeys.BankMappingsSettings}:${processor}`,
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

    private async getIntegration(
        processor?: TransactionProcessor,
    ): Promise<IBankResolveIntegration & ITransferIntegration> {
        if (processor == TransactionProcessor.Flutterwave) {
            return new FlutterwaveService(this.config, this.http);
        }

        if (processor == TransactionProcessor.Paystack) {
            return new PaystackService(this.config, this.http, this.reporter);
        }

        return new ProvidusService(this.config, this.http, this.reporter);
    }

    getSettlementIntegration(): ProvidusService {
        return new ProvidusService(this.config, this.http, this.reporter);
    }

    async getMainTransferSettings(): Promise<ITransferSettings> {
        return this.redisService.jsonGet(RedisKeys.MainTransferSettings);
    }

    async getBackupTransferSettings(): Promise<ITransferSettings> {
        return this.redisService.jsonGet(RedisKeys.BackupTransferSettings);
    }

    async getProcessorBankCode(code: string, processor: string): Promise<string> {
        if (processor == TransactionProcessor.Providus) {
            return code;
        }
        let mappings = await this.redisService.jsonGet<Record<string, ProcessorBankMapping>>(
            `${RedisKeys.BankMappingsSettings}:${processor}`,
        );
        mappings = mappings || {};

        const mapping = Object.values(mappings);
        const map = mapping.find((v) => v.code == code);
        if (map) {
            return map.processorCode;
        }

        throw PaymentException.InvalidBankCode;
    }

    async resolveBankAccount(data: ResolveBankAccountDto): Promise<[ResolvedAccount, ITransferSettings]> {
        try {
            const transferSettings = await this.getMainTransferSettings();
            const integration = await this.getIntegration(transferSettings.processor);
            const resolved = await this._resolveBankAccount(data, integration);

            if (!resolved) {
                throw PaymentException.BankAccountNotFound;
            }

            return [resolved, transferSettings];
        } catch (e) {
            if (e.code == PaymentErrors.BankAccountNotFound) {
                throw e;
            }

            const transferSettings = await this.getBackupTransferSettings();
            const integration = await this.getIntegration(transferSettings.processor);
            const resolved = await this._resolveBankAccount(data, integration);
            if (!resolved) {
                throw PaymentException.BankAccountNotFound;
            }
            return [resolved, transferSettings];
        }
    }

    async _resolveBankAccount(
        data: ResolveBankAccountDto,
        integration: IBankResolveIntegration,
    ): Promise<ResolvedAccount> {
        try {
            const resolved = await retry(
                async () => {
                    const bankCode = await this.getProcessorBankCode(data.bankCode, integration.processor);
                    return integration.resolveBankAccount(data.accountNumber, bankCode);
                },
                { retries: 2 },
            );

            return resolved;
        } catch (e) {
            this.reporter.pushInfo({
                message: `${integration.processor} processor failed resolve bank account name`,
                data: e,
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

        if (transferSettings.processor == TransactionProcessor.Providus && bankCode == PROVIDUS_BANK_CODE) {
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

    async getTransferStatus(
        tenant: TenantDataSource,
        payment: HydratedDocument<Payment>,
    ): Promise<ProcessorPaymentFinalStatusData> {
        if (tenant != TenantDataSource.Live) {
            return { status: PaymentStatus.Success };
        }
        const integration = await this.getIntegration(payment.processor);
        return integration.getStatus(payment);
    }
}
