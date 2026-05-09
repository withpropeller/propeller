import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { IFundingSource } from './payment.schema';
import { AppStatus } from '@core/helpers';
import { AccessKey } from '@core/interfaces';
import { HydratedDocument } from 'mongoose';
import { AccountService } from '@api/account/account.service';
import { CustomerService } from '@api/customer/customer.service';
import { AppException } from '@core/exceptions';
import { BusinessService } from '@models/business/business.service';
import { EnvoyService } from '@common/envoy';
import { TransactionCurrency, TransactionProcessor } from '@api/transactions/transactions.enums';
import { Business } from '@models/business/business.schema';
import { PaymentException } from './payment.exception';
import { PaymentService } from './payment.service';
import { PaymentMethod, PaymentType } from './payment.enums';
import { ConfigurationService } from '@api/tools/configuration/configuration.service';
import { ExecutionOptions } from '@common/interfaces';
import { ConfigService } from '@config/config.service';
import { EventService } from '@api/events/events.service';
import { CreateBillPaymentDto } from './bill-payment.dto';
import { GetTagModel, ModelIdTag, TagMap } from '@core/mongo';
import { AccountCurrency } from '@api/account/account.enums';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class BillPaymentService extends PaymentService {
    constructor(
        @Inject(REQUEST) request: TenantRequestPayload,
        envoy: EnvoyService,
        moduleRef: ModuleRef,
        customerService: CustomerService,
        accountService: AccountService,
        eventService: EventService,
        private businessService: BusinessService,
        private configurationService: ConfigurationService,
        config: ConfigService,
    ) {
        super(request, envoy, moduleRef, customerService, accountService, eventService, config);
    }

    async create(data: CreateBillPaymentDto, key: AccessKey, options: ExecutionOptions) {
        const business = await this.businessService.safeGet(key.businessId, this.request);

        if (data.reference) {
            const payment = await this.repo.findOne({ reference: data.reference, business: business.id }, true, 'id');
            if (payment) {
                throw AppException.ReferenceConflict;
            }
        }

        const config = await this.configurationService.get(business, 'payment');

        const debitSource = await this.getDebitSource(
            business,
            config,
            (data as any).debitSource,
            AccountCurrency.NGN,
        );

        const customer = await this.getCustomer(business, debitSource, (data as any).customer);

        const entity: any = {
            type: PaymentType.Bill,
            processor: TransactionProcessor.ProviPay,
            business: business.id,
            customer: customer?.id,
            reference: data.reference,
            amount: (data as any).amount ?? 0,
            fees: 0,
            currency: TransactionCurrency.NGN,
            fundingSource: debitSource.id,
            fundingSourceRef: debitSource.ref,
            account: debitSource.account.id,
            method: PaymentMethod.Billing,
            methodData: { billing: {} },
            metadata: (data as any).metadata,
        };

        try {
            const payment = await this.repo.createAndSave(entity, options);
            if (!options?.dryRun) {
                await this.sendToEnvoy(payment);
            }
            return payment;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    async validate(_data: CreateBillPaymentDto, _key: AccessKey) {
        return {};
    }

    async getDebitSource(
        business: HydratedDocument<Business>,
        config: any,
        debitSource: TagMap | undefined,
        currency: AccountCurrency,
    ): Promise<IFundingSource> {
        if (debitSource) {
            return this.getFundingSource(business, debitSource, currency);
        }
        if (config?.payment?.billAccount) {
            return this.getAccountFundingSource(business, config.payment.billAccount, currency);
        }
        const account = await this.accountService.safeGetMainDefault(business.id, currency as any);
        return {
            id: account.id,
            ref: GetTagModel(ModelIdTag.Account),
            account: account,
        };
    }
}
