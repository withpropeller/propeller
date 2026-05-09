import { APIPagingDto } from '@common/api-paging';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { AppException } from '@core/exceptions';
import { AppStatus } from '@core/helpers';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CustomerDto, PatchCustomerDto } from './customer.dto';
import { CustomerException } from './customer.exception';
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
import { ExecutionOptions } from '@common/interfaces';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { validatesCustomerLegalAgeClaim } from './customer.utils';
import { CustomerValidationOptions } from './customer.interface';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CustomerService {
    public repo: Repository<Customer>;

    constructor(@Inject(REQUEST) private request: TenantRequestPayload, private moduleRef: ModuleRef) {
        const model = this.moduleRef.get(getModelToken(Customer.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Customer>(model);
    }

    async create(
        businessId: Types.ObjectId,
        body: CustomerDto,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Customer>> {
        const data = { ...body, business: businessId };

        // verify if customer verification exists
        if (data.verifications) {
            for (const verification of data.verifications) {
                if (verification.status === CustomerVerificationStatus.Verified) {
                    const partial = this.repo.createPartial(data);
                    await this.ensureVerification(partial, [verification.type]);
                }
            }
        }

        try {
            const customer = await this.repo.createAndSave(data, options);
            return customer;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable;
        }
    }

    async update(
        businessId: Types.ObjectId,
        id: string,
        body: PatchCustomerDto,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Customer>> {
        const customer = await this.findByIdOrReference(businessId, id);

        const data = { ...body, business: businessId };
        const session = await this.repo.model.startSession();

        try {
            session.startTransaction();
            const updatedCustomer = await this.repo.findOneAndUpdate({ _id: customer._id }, data, {
                session,
                ...options,
            });

            if (data.verifications) {
                for (const verification of data.verifications) {
                    if (verification.status === CustomerVerificationStatus.Verified) {
                        await this.ensureVerification(updatedCustomer, [verification.type]);
                    }
                }
            }
            await session.commitTransaction();
            return updatedCustomer;
        } catch (err) {
            await session.abortTransaction();
            if (err instanceof CustomerException) {
                throw err;
            }
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable;
        } finally {
            session.endSession();
        }
    }

    async findByIdOrReference(businessId: Types.ObjectId, id: string, query?: APIPagingDto) {
        const customerId = ParseTagId(id, [ModelIdTag.Customer]);
        if (customerId) {
            return this.repo.findOneWithOptions({
                conditions: { _id: customerId, business: businessId },
                expand: query?.expand,
                select: query?.select,
            });
        }

        return this.repo.findOneWithOptions({
            conditions: { reference: id, business: businessId },
            expand: query?.expand,
            select: query?.select,
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

    async safeGetByReference(
        businessId: Types.ObjectId,
        reference: string,
        failSilently: boolean,
    ): Promise<HydratedDocument<Customer>> {
        const customer = await this.repo.findOne({ reference, business: businessId }, failSilently);

        if (customer && customer.status !== CustomerStatus.Active) {
            throw CustomerException.CustomerNotActive;
        }

        return customer;
    }

    async fetchCustomer(businessId: Types.ObjectId, referenceOrId: string): Promise<HydratedDocument<Customer>> {
        return this.safeGetCustomerByIdOrReference(businessId, referenceOrId);
    }

    async ensureCustomer(businessId: Types.ObjectId, referenceOrId: string): Promise<HydratedDocument<Customer>> {
        const customer = await this.safeGetCustomerByIdOrReference(businessId, referenceOrId, true);
        if (!customer) {
            return this.create(businessId, { reference: referenceOrId } as any);
        }

        return customer;
    }

    async safeGetCustomerByIdOrReference(businessId: Types.ObjectId, reference: any, failSilently?: boolean) {
        if (!reference) return null;

        if (Types.ObjectId.isValid(reference)) {
            return this.safeGet(businessId, reference);
        }

        const customerId = ParseTagId(reference, [ModelIdTag.Customer]);
        if (customerId) {
            return this.safeGet(businessId, customerId);
        }

        return this.safeGetByReference(businessId, reference, failSilently);
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

    async safeGetVerificationWithOpts(
        businessId: Types.ObjectId,
        id: Types.ObjectId,
        opts: CustomerValidationOptions,
    ): Promise<HydratedDocument<Customer>> {
        const customer = await this.safeGetCustomerByIdOrReference(businessId, id);

        return this.ensureVerification(customer, opts.validTiers, opts.validateLegalAge);
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
}
