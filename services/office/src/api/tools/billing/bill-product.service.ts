import { AdminService } from '@api/admins/admin.service';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { StorageService } from '@common/services/storage.service';
import { GetTenantDataSource, TenantRequestPayload } from '@core/helpers';
import { getModelToken } from '@nestjs/mongoose';
import { BillProduct } from './bill-product.schema';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { ExecutionOptions } from '@common/interfaces';
import { AWSObjectURL } from '@common/models/aws-object';
import { CreateBillProductDto, UpdateBillProductDto } from './bill-product.dto';
import { Request } from 'express';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { Types } from 'mongoose';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class BillProductService {
    public repo: Repository<BillProduct>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private auditService: AdminAuditService,
        private adminService: AdminService,
        private storageService: StorageService,
    ) {
        const model = this.moduleRef.get(getModelToken(BillProduct.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<BillProduct>(model);
    }

    async create(adminId: Types.ObjectId, dto: CreateBillProductDto, options: ExecutionOptions, req: Request) {
        const admin = await this.adminService.findById(adminId);

        let awsDoc: AWSObjectURL;

        if (dto.iconUrl) {
            awsDoc = await this.storageService.uploadViaUrl(`bill-product-assets`, dto.iconUrl, options);
        }

        const product = await this.repo.createAndSave({ ...dto, icon: awsDoc }, options);
        if (product.parent) {
            await this.repo.updateById(product.parent, { $push: { children: product.id } }, options);
        }

        if (!options.dryRun) {
            await this.auditService.registerToolsBillProductCreate(product.id, dto, admin, req);
        }

        return product;
    }

    async updateIcon(
        adminId: Types.ObjectId,
        productId: Types.ObjectId,
        file: Express.Multer.File,
        options: ExecutionOptions,
        req: Request,
    ) {
        const admin = await this.adminService.findById(adminId);

        const product = await this.repo.findById(productId);
        const awsDoc = await this.storageService.uploadFile(`bill-product-assets`, file);

        await this.repo.updateById(product.id, { icon: awsDoc }, options);
        if (product.icon) {
            await this.storageService.deleteDocument(product.icon.keyName, options);
        }

        if (!options.dryRun) {
            await this.auditService.registerToolsBillProductUpdateUpload(product.id, admin, req);
        }
    }

    async update(
        adminId: Types.ObjectId,
        productId: Types.ObjectId,
        dto: UpdateBillProductDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        const admin = await this.adminService.findById(adminId);

        const product = await this.repo.findById(productId);
        const awsDoc = dto.iconUrl
            ? await this.storageService.uploadViaUrl(`bill-product-assets`, dto.iconUrl, options)
            : product.icon;

        await this.repo.updateById(product.id, { ...dto, icon: awsDoc }, options);

        if (dto.parent) {
            await this.repo.updateById(product.parent, { $pull: { children: product.id } }, options);
            await this.repo.updateById(product.parent, { $push: { children: product.id } }, options);
        }

        if (!options.dryRun) {
            await this.auditService.registerToolsBillProductUpdate(product.id, dto, admin, req);
        }
    }

    async delete(adminId: Types.ObjectId, productId: Types.ObjectId, options: ExecutionOptions, req: Request) {
        const admin = await this.adminService.findById(adminId);
        const product = await this.repo.findById(productId);
        await this.repo.deleteById(product.id, options);
        if (product.icon) {
            await this.storageService.deleteDocument(product.icon.keyName, options);
        }
        if (product.parent) {
            await this.repo.updateById(product.parent, { $pull: { children: product.id } }, options);
        }

        if (!options.dryRun) {
            await this.auditService.registerToolsBillProductDelete(product.id, admin, req);
        }
    }
}
