import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '@core/services/redis.service';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { AdminService } from '@api/admins/admin.service';
import { HydratedDocument, Model, Types } from 'mongoose';
import { APIPagingDto } from '@common/api-paging';
import { CreateMerchantDto, MatchDescriptorPhraseDto } from './merchant.dtos';
import { Merchant } from './merchant.schema';
import { Repository } from '@core/abstracts';
import { RedisKeys, TenantDataSource } from '@core/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { ExecutionOptions } from '@common/interfaces';
import { AWSObjectURL } from '@common/models/aws-object';
import { StorageService } from '@common/services/storage.service';
import { Request } from 'express';
import { extractMerchantAffix, ExtractMerchantCategory, findMatchingMerchant } from './merchant.utils';
import { AppException } from '@core/exceptions';

@Injectable()
export class MerchantService extends Repository<Merchant> {
    constructor(
        @InjectModel(Merchant.name, TenantDataSource.Core)
        readonly model: Model<HydratedDocument<Merchant>>,
        private redisService: RedisService,
        private auditService: AdminAuditService,
        private adminService: AdminService,
        private storageService: StorageService,
    ) {
        super(model);
    }

    async create(adminId: Types.ObjectId, dto: CreateMerchantDto, options: ExecutionOptions, req: Request) {
        const admin = await this.adminService.findById(adminId);

        let awsDoc: AWSObjectURL;

        if (dto.iconUrl) {
            awsDoc = await this.storageService.uploadViaUrl(`merchant-assets`, dto.iconUrl, options);
        }

        const merchantCategory = ExtractMerchantCategory(dto.mcc);
        const data = { ...dto, category: merchantCategory, icon: awsDoc };
        const merchant = await this.createAndSave(data, options);

        if (!options.dryRun) {
            const data = {
                id: merchant.id,
                mcc: merchant.mcc,
                category: merchant.category,
                patterns: merchant.patterns,
            };
            const samplePatterns = merchant.patterns.map((v) => v.samples).flat();

            await this.redisService.jsonSet(`${RedisKeys.MerchantSettings}:${merchant.id}`, data);
            await this.redisService.sRem(RedisKeys.SettingsMerchantUnclassified, samplePatterns);
            await this.auditService.registerToolsMerchantCreate(merchant.id, dto, admin, req);
        }

        return merchant;
    }

    async updateIcon(
        adminId: Types.ObjectId,
        merchantId: Types.ObjectId,
        file: Express.Multer.File,
        options: ExecutionOptions,
        req: Request,
    ) {
        const admin = await this.adminService.findById(adminId);

        const merchant = await this.findById(merchantId);
        const awsDoc = await this.storageService.uploadFile(`merchant-assets`, file);

        await this.updateById(merchant.id, { icon: awsDoc }, options);
        if (merchant.icon) {
            await this.storageService.deleteDocument(merchant.icon.keyName, options);
        }

        if (!options.dryRun) {
            await this.auditService.registerToolsMerchantUpdateUpload(merchant.id, admin, req);
        }
    }

    async fetchCachedMerchants(query: APIPagingDto) {
        return this.redisService.search(RedisKeys.MerchantSettingsIdxKey, '*', query);
    }

    async fetchUnclassified() {
        return this.redisService.sMembers(RedisKeys.SettingsMerchantUnclassified);
    }

    async removeUnclassified(members: string[]) {
        await this.redisService.sRem(RedisKeys.SettingsMerchantUnclassified, members);
    }

    async fetchMerchantWithPhrase(dto: MatchDescriptorPhraseDto) {
        const merchant = await this.matchMerchantDescriptor(dto);
        if (merchant) {
            return this.findById(merchant.id);
        }

        throw AppException.NotFound.setMessage(`${this.collectionName} not found`);
    }

    async matchMerchantDescriptor(dto: MatchDescriptorPhraseDto): Promise<HydratedDocument<Merchant> | null> {
        const affixes = extractMerchantAffix(dto.phrase);
        for (const affix of affixes) {
            if (affix == '') continue;

            const res = await this.redisService.search<HydratedDocument<Merchant>>(
                RedisKeys.MerchantSettingsIdxKey,
                `@affix:{${affix}}`,
                {},
            );

            const merchant = findMatchingMerchant(res.data, dto.phrase, affix);
            if (merchant) return merchant;
        }
        return null;
    }

    async update(
        adminId: Types.ObjectId,
        merchantId: Types.ObjectId,
        dto: CreateMerchantDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        const admin = await this.adminService.findById(adminId);

        let awsDoc: AWSObjectURL;

        if (dto.iconUrl) {
            awsDoc = await this.storageService.uploadViaUrl(`merchant-assets`, dto.iconUrl, options);
        }

        const merchant = await this.findById(merchantId);
        const update = { ...dto, icon: awsDoc };

        if (dto.mcc) {
            const merchantCategory = ExtractMerchantCategory(dto.mcc ?? merchant.mcc);
            update['category'] = merchantCategory;
        }

        await this.updateById(merchant.id, update, options);
        if (merchant.icon) {
            await this.storageService.deleteDocument(merchant.icon.keyName, options);
        }

        if (!options.dryRun) {
            const data = {
                id: merchant.id,
                mcc: merchant.mcc,
                patterns: merchant.patterns,
            };
            const samplePatterns = merchant.patterns.map((v) => v.samples).flat();

            await this.redisService.jsonSet(`${RedisKeys.MerchantSettings}:${merchant.id}`, data);
            await this.redisService.sRem(RedisKeys.SettingsMerchantUnclassified, samplePatterns);
            await this.auditService.registerToolsMerchantUpdate(merchant.id, dto, admin, req);
        }
    }

    async delete(adminId: Types.ObjectId, merchantId: Types.ObjectId, options: ExecutionOptions, req: Request) {
        const admin = await this.adminService.findById(adminId);

        const merchant = await this.findById(merchantId);
        await this.deleteById(merchant.id, options);

        if (merchant.icon) {
            await this.storageService.deleteDocument(merchant.icon.keyName, options);
        }

        if (!options.dryRun) {
            await this.redisService.delete(`${RedisKeys.MerchantSettings}:${merchantId}`);
            await this.auditService.registerToolsMerchantDelete(merchantId, admin, req);
        }
    }
}
