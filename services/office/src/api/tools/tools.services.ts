import { ConfigService } from '@config/config.service';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '@core/services/redis.service';
import {
    ProvidusSettlementRepushDto,
    TransactionCategoriesDto,
    UpdateFxRateDto,
    UpdateTransferSettingsDto,
} from './tools.dto';
import { FxRate } from './tools.enums';
import { ProvidusService } from '@common/integrations/providus.service';
import { Request } from 'express';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { AdminService } from '@api/admins/admin.service';
import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { IBankSettlementIntegration } from './banks/banks.interface';
import { AppException } from '@core/exceptions';
import { Utils, RedisKeys } from '@core/helpers';
import { Types } from 'mongoose';
import { ReporterService } from '@common/services/reporter.service';

@Injectable()
export class ToolsService {
    constructor(
        readonly config: ConfigService,
        readonly http: HttpService,
        private redisService: RedisService,
        private auditService: AdminAuditService,
        private adminService: AdminService,
        private reporter: ReporterService,
    ) {}

    async addKeyValueJsonSettings<T = any>(redisKey: string, list: T[], jsonKey: string) {
        let obj = await this.redisService.jsonGet<Record<string, T>>(redisKey);
        obj = obj || {};

        const listToUpdate = list.reduce((prev, curr) => ({ ...prev, [curr[jsonKey]]: curr }), {});
        const update = { ...obj, ...listToUpdate };

        await this.redisService.jsonSet(redisKey, update);
    }

    async removeKeyValueJsonSettings(redisKey: string, jsonKey: string) {
        return this.redisService.jsonDeletePath(redisKey, jsonKey);
    }

    async getKeyValueJsonSettings<T>(redisKey: string) {
        let obj = await this.redisService.jsonGet<Record<string, T>>(redisKey);
        obj = obj || {};

        return Object.values(obj);
    }

    async getExchangeRates(): Promise<FxRate[]> {
        const results = (await this.redisService.timeSeriesFilter({
            type: RedisKeys.FxRateSettings,
        })) as any;

        return results.map((v: string[][]) => {
            const obj = Object.fromEntries(v[1] as any);
            const map = new Map(Object.entries(obj));
            map.delete('type');
            map.set('rate', Number(v[2][1]));
            map.set('lastUpdated', new Date(v[2][0]));

            return Object.fromEntries(map);
        });
    }

    async updateExchangeRate(data: UpdateFxRateDto) {
        const key = `${RedisKeys.FxRateSettings}:${data.from}:${data.to}`;

        try {
            const labels = {
                type: RedisKeys.FxRateSettings,
                from: data.from,
                to: data.to,
            };
            await this.redisService.timeSeriesCreate(key, labels);
        } catch (err) {
            Logger.error('error creating timeseries', err, 'ToolsService');
        }

        await this.redisService.timeSeriesAdd(key, data.rate);

        Logger.log('Updated exchange rates to Redis Timeseries', 'ToolsService');
    }

    async repushSettlement(adminId: Types.ObjectId, data: ProvidusSettlementRepushDto, req: Request) {
        const integration = this.getSettlementIntegration(TransactionProcessor.Providus);
        const admin = await this.adminService.findById(adminId);

        const response = await integration.repushSettlement(data);

        await this.auditService.registerProvidusRepushSettlement(data, admin, req);

        return response;
    }

    async repushSettlementForce(adminId: Types.ObjectId, data: ProvidusSettlementRepushDto, req: Request) {
        const integration = this.getSettlementIntegration(TransactionProcessor.Providus);
        const admin = await this.adminService.findById(adminId);

        const response = await integration.retriggerManualSettlement(data.sessionId);

        if (response.data?.responseCode === '00') {
            await this.auditService.registerProvidusRepushSettlement(data, admin, req);
            return {
                code: 'success',
                message: 'Payment received successfully',
            };
        }

        throw AppException.BadRequest.setMessage(response.data?.responseMessage);
    }

    private getSettlementIntegration(processor: TransactionProcessor): IBankSettlementIntegration {
        if (processor == TransactionProcessor.Providus) {
            return new ProvidusService(this.config, this.http, this.reporter);
        }

        throw AppException.BadRequest.setMessage('Invalid Processor');
    }

    async getTransferSettings(type: string): Promise<UpdateTransferSettingsDto> {
        return this.redisService.jsonGet<UpdateTransferSettingsDto>(`${RedisKeys.TransferSettings}:${type}`);
    }

    async updateTransferSettings(adminId: Types.ObjectId, data: UpdateTransferSettingsDto, req: Request) {
        const admin = await this.adminService.findById(adminId);

        await this.redisService.jsonSet(`${RedisKeys.TransferSettings}:${data.type}`, data);

        await this.auditService.registerToolsSettingsUpdateTransfer(data, admin, req);
    }

    async getTransactionCategories() {
        const hash = await this.redisService.hashGetAll(RedisKeys.CategorySettings);
        return Object.entries(hash).map((v) => ({ key: v[0], value: v[1] }));
    }

    async addTransactionCategories(body: TransactionCategoriesDto) {
        const categories = body.categories.reduce((obj, curr) => {
            const slug = Utils.toSlug(curr);
            return { ...obj, [slug]: curr };
        }, {});

        return this.redisService.hashSetAll(RedisKeys.CategorySettings, categories);
    }
}
