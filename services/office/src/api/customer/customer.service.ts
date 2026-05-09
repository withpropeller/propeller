import { APIPagingDto } from '@common/api-paging';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantDataSource } from '@core/helpers';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import {
    Customer,
    CustomerStatus,
    CustomerType,
    CustomerVerificationMinimumTier1,
    CustomerVerificationMinimumTier2,
    CustomerVerificationMinimumTier3,
    CustomerVerificationStatus,
    CustomerVerificationType,
} from './customer.schema';
import { Business } from '@api/business/business.schema';
import { CustomerException } from './customer.exception';
import { CustomerValidationOptions } from './customer.interface';
import { validatesCustomerLegalAgeClaim } from './customer.utils';
import { IsMongoId } from 'class-validator';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { MetricsQueryDto } from '@common/dtos';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CustomerService {
    public repo: Repository<Customer>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        @InjectModel(Business.name, TenantDataSource.Core)
        private businessModel: Model<HydratedDocument<Business>>,
    ) {
        const model = this.moduleRef.get(getModelToken(Customer.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Customer>(model);
    }

    getAll(query: APIPagingDto) {
        return this.repo.findByQuery(query, {}, [], [{ path: 'business', model: this.businessModel }]);
    }

    getOne(id: Types.ObjectId, query: APIPagingDto) {
        return this.repo.findOneWithOptions({
            conditions: { _id: id },
            select: query.select,
            expand: query.expand,
            populate: [{ path: 'business', model: this.businessModel }],
        });
    }

    async safeGet(businessId: Types.ObjectId, id: Types.ObjectId): Promise<HydratedDocument<Customer>> {
        const customer = await this.repo.findOne({
            _id: id,
            business: businessId,
        });

        if (customer.status !== CustomerStatus.Active) {
            throw CustomerException.CustomerNotActive;
        }

        return customer;
    }

    async safeGetByReference(businessId: Types.ObjectId, reference: string): Promise<HydratedDocument<Customer>> {
        const customer = await this.repo.findOne({
            reference,
            business: businessId,
        });

        if (customer.status !== CustomerStatus.Active) {
            throw CustomerException.CustomerNotActive;
        }

        return customer;
    }

    async safeGetCustomerByIdOrReference(businessId: Types.ObjectId, reference: any) {
        if (!reference) return null;

        if (IsMongoId(reference)) {
            return this.safeGet(businessId, reference);
        }

        const customerId = ParseTagId(reference, [ModelIdTag.Customer]);
        if (customerId) {
            return this.safeGet(businessId, customerId);
        }

        return this.safeGetByReference(businessId, reference);
    }

    async safeGetVerification(
        businessId: Types.ObjectId,
        id: Types.ObjectId,
        validTiers: CustomerVerificationType[],
        validateLegalAge?: boolean,
    ): Promise<HydratedDocument<Customer>> {
        const customer = await this.safeGetCustomerByIdOrReference(businessId, id);

        return this.ensureVerification(customer, validTiers, validateLegalAge);
    }

    async ensureVerification(
        customer: HydratedDocument<Customer>,
        validTiers: CustomerVerificationType[],
        validateLegalAge?: boolean,
    ): Promise<HydratedDocument<Customer>> {
        if (customer.type === CustomerType.Individual) {
            return this.ensureIndividualVerification(customer, { validTiers, validateLegalAge });
        }

        return this.ensureCorporateVerification(customer, { validTiers });
    }

    async ensureIndividualVerification(
        customer: HydratedDocument<Customer>,
        opts: CustomerValidationOptions,
    ): Promise<HydratedDocument<Customer>> {
        if (!Array.isArray(customer.verifications)) {
            throw CustomerException.VerificationLevelInsufficient.setMessage(
                'Customer verification level insufficient, required: ' + opts.validTiers.join(', '),
            );
        }

        const userHasKYC = customer.verifications.some((v) => {
            return opts.validTiers.includes(v.type) && v.status === CustomerVerificationStatus.Verified;
        });

        if (!userHasKYC) {
            throw CustomerException.VerificationLevelInsufficient.setMessage(
                'Customer verification level insufficient, required: ' + opts.validTiers.join(', '),
            );
        }

        if (!opts.validTiers.includes(CustomerVerificationType.Tier0) && !customer.claims) {
            throw CustomerException.ClaimsRequired.setMessage(
                'Customer claims required for tiers: ' + CustomerVerificationMinimumTier1.join(', '),
            );
        }

        if (
            !opts.validTiers.includes(CustomerVerificationType.Tier0) &&
            opts.validateLegalAge &&
            !validatesCustomerLegalAgeClaim(customer)
        ) {
            throw CustomerException.ClaimsIncomplete.setMessage(
                'Customer Individual Information requires legal age to be 18 or older',
            );
        }

        if (!opts.validTiers.includes(CustomerVerificationType.Tier0) && !customer.claims.individualInformation) {
            throw CustomerException.ClaimsIncomplete.setMessage(
                'Customer Individual Information required for: ' + CustomerVerificationMinimumTier1.join(', '),
            );
        }

        if (
            !opts.validTiers.includes(CustomerVerificationType.Tier0) &&
            !opts.validTiers.includes(CustomerVerificationType.Tier1) &&
            !customer.claims.individualIdentity
        ) {
            throw CustomerException.ClaimsIncomplete.setMessage(
                'Customer Individual Identity required for: ' + CustomerVerificationMinimumTier2.join(', '),
            );
        }

        if (
            !opts.validTiers.includes(CustomerVerificationType.Tier0) &&
            !opts.validTiers.includes(CustomerVerificationType.Tier1) &&
            !opts.validTiers.includes(CustomerVerificationType.Tier2) &&
            !customer.claims.individualAddress
        ) {
            throw CustomerException.ClaimsIncomplete.setMessage(
                'Customer Individual Address required for: ' + CustomerVerificationMinimumTier3.join(', '),
            );
        }

        if (!Array.isArray(customer.verifications)) {
            throw CustomerException.VerificationLevelInsufficient;
        }

        return customer;
    }

    async ensureCorporateVerification(
        customer: HydratedDocument<Customer>,
        opts: CustomerValidationOptions,
    ): Promise<HydratedDocument<Customer>> {
        if (!Array.isArray(customer.verifications)) {
            throw CustomerException.VerificationLevelInsufficient.setMessage(
                'Customer verification level insufficient, required: ' + opts.validTiers.join(', '),
            );
        }

        const userHasKYC = customer.verifications.some((v) => {
            return opts.validTiers.includes(v.type) && v.status === CustomerVerificationStatus.Verified;
        });

        if (!userHasKYC) {
            throw CustomerException.VerificationLevelInsufficient.setMessage(
                'Customer verification level insufficient, required: ' + opts.validTiers.join(', '),
            );
        }

        if (!opts.validTiers.includes(CustomerVerificationType.Tier0) && !customer.claims) {
            throw CustomerException.ClaimsRequired.setMessage(
                'Customer claims required for tiers: ' + CustomerVerificationMinimumTier1.join(', '),
            );
        }

        if (!opts.validTiers.includes(CustomerVerificationType.Tier0) && !customer.claims.businessInformation) {
            throw CustomerException.ClaimsIncomplete.setMessage(
                'Customer Business Information required for: ' + CustomerVerificationMinimumTier1.join(', '),
            );
        }

        if (
            !opts.validTiers.includes(CustomerVerificationType.Tier0) &&
            !opts.validTiers.includes(CustomerVerificationType.Tier1) &&
            !customer.claims.businessIdentity
        ) {
            throw CustomerException.ClaimsIncomplete.setMessage(
                'Customer Business Identity required for: ' + CustomerVerificationMinimumTier2.join(', '),
            );
        }

        if (
            !opts.validTiers.includes(CustomerVerificationType.Tier0) &&
            !opts.validTiers.includes(CustomerVerificationType.Tier1) &&
            !opts.validTiers.includes(CustomerVerificationType.Tier2) &&
            !customer.claims.businessAddress
        ) {
            throw CustomerException.ClaimsIncomplete.setMessage(
                'Customer Business Address required for: ' + CustomerVerificationMinimumTier3.join(', '),
            );
        }

        return customer;
    }

    getOfficialName(customer: HydratedDocument<Customer>): string {
        if (customer.type === CustomerType.Individual) {
            if (!customer.claims?.individualInformation) {
                throw CustomerException.ClaimsIncomplete;
            }
            return (
                customer.claims.individualInformation.firstName + ' ' + customer.claims.individualInformation.lastName
            );
        }

        if (!customer.claims?.businessInformation) {
            throw CustomerException.ClaimsIncomplete;
        }

        return customer.claims.businessInformation.registrationName;
    }

    async getMetrics(query: MetricsQueryDto) {
        const matchStage: Record<string, any> = {};
        if (query.from || query.to) {
            matchStage.createdAt = {};
            if (query.from) matchStage.createdAt.$gte = new Date(query.from);
            if (query.to) matchStage.createdAt.$lte = new Date(query.to);
        }

        const [result] = await this.repo.aggregate([
            ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    byType: [
                        { $group: { _id: '$type', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
            {
                $project: {
                    byStatus: {
                        $arrayToObject: {
                            $map: { input: '$byStatus', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    byType: {
                        $arrayToObject: {
                            $map: { input: '$byType', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byStatus: {}, byType: {}, total: 0 };
    }
}
