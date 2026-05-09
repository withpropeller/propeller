import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { AccountService } from '@api/account/account.service';
import { CustomerService } from '@api/customer/customer.service';
import { AppException } from '@core/exceptions';
import { EnvoyService } from '@common/envoy';
import { PaymentService } from './payment.service';
import { PaymentType, PaymentMethod } from './payment.enums';
import { AppStatus } from '@core/helpers';
import { TagMap, GetTagModel, ModelIdTag } from '@core/mongo';
import { Business } from '@models/business/business.schema';
import { HydratedDocument } from 'mongoose';
import { IFundingSource, Payment } from './payment.schema';
import { CreateFxChargeDto } from './payment.interface';
import { ExecutionOptions } from '@common/interfaces';
import { ConfigService } from '@config/config.service';
import { EventService } from '@api/events/events.service';
import { AccountCurrency } from '@api/account/account.enums';
import { TransactionProcessor } from '@api/transactions/transactions.enums';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ChargePaymentService extends PaymentService {
    constructor(
        @Inject(REQUEST) request: TenantRequestPayload,
        envoy: EnvoyService,
        moduleRef: ModuleRef,
        customerService: CustomerService,
        accountService: AccountService,
        eventService: EventService,
        config: ConfigService,
    ) {
        super(request, envoy, moduleRef, customerService, accountService, eventService, config);
    }

    async fxChargeAccount(dto: CreateFxChargeDto, options?: ExecutionOptions): Promise<HydratedDocument<Payment>> {
        const payment = await this._createFxCharge(dto, options);
        return this.processPayment(payment, options);
    }

    async getDebitSource(
        business: HydratedDocument<Business>,
        currency: AccountCurrency,
        source?: TagMap,
    ): Promise<IFundingSource> {
        if (source) {
            return this.getFundingSource(business, source, currency);
        }

        const account = await this.accountService.safeGetMainDefault(business.id, currency as any);
        return {
            id: account.id,
            ref: GetTagModel(ModelIdTag.Account),
            account: account,
        };
    }

    private async _createFxCharge(
        dto: CreateFxChargeDto,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Payment>> {
        // Get Fee breakdown
        const breakdown = await this.getFxFeeBreakdown(dto.fxQuote);

        const entity = {
            type: PaymentType.Charge,
            processor: TransactionProcessor.Maplerad,
            business: dto.business.id,
            customer: dto.customer?.id,
            reference: dto.reference,
            amount: dto.fxQuote.fromAmount,
            fees: breakdown.totalFees,
            feesBreakdown: breakdown.feesBreakdown,
            currency: dto.fxQuote.fromCurrency,
            fundingSource: dto.debitSource.id,
            fundingSourceRef: dto.debitSource.ref,
            account: dto.debitSource.account.id,
            method: PaymentMethod.FxCharge,
            methodData: {
                fxCharge: {
                    type: dto.chargeType,
                    currency: dto.fxQuote.toCurrency,
                    rate: dto.fxQuote.rate,
                    amount: dto.fxQuote.toAmount,
                    for: dto.chargeFor,
                    forRef: dto.chargeForRef,
                },
            },
            metadata: dto.metadata,
        };

        try {
            const payment = await this.repo.createAndSave(entity, options);
            return payment;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable.setError(err);
        }
    }
}
