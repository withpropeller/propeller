import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { PaymentRequest } from './payment-request.schema';
import {
    CreatePaymentRequestBankTransferDto,
    CreatePaymentRequestPaymentAuthorizationDto,
    ICreatePaymentRequestDto,
} from './payment-request.dto';
import { AccessKey } from '@core/interfaces';
import { BusinessService } from '@models/business/business.service';
import { AppStatus, Utils } from '@core/helpers';
import { CustomerService } from '@api/customer/customer.service';
import { AccountService } from '@api/account/account.service';
import { Account } from '@api/account/accounts.schema';
import { DepositChannelType } from '@api/account/account.enums';
import { AppException } from '@core/exceptions';
import { HydratedDocument, Types } from 'mongoose';
import { addMinutes } from 'date-fns';
import { APIPagingDto } from '@common/api-paging';
import { Business } from '@models/business/business.schema';
import { ConfigurationService } from '@api/tools/configuration/configuration.service';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { ExecutionOptions, ExecutionOptionsWithRequest } from '@common/interfaces';
import { PaymentRequestMethod, PaymentRequestStatus } from './payment.request.enums';
import { INibssDirectDebitIntegration } from '@common/integrations/integrations.interfaces';
import { IntegrationProviders } from '@common/integrations/integrations.providers';
import { toAccountCurrency } from '@api/balance/balance.utils';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class PaymentRequestService {
    public repo: Repository<PaymentRequest>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private businessService: BusinessService,
        private customerService: CustomerService,
        private accountService: AccountService,
        private configurationService: ConfigurationService,
        @Inject(IntegrationProviders.NIBSS_DIRECT_DEBIT) private nibssDirectDebitService: INibssDirectDebitIntegration,
    ) {
        const model = this.moduleRef.get(getModelToken(PaymentRequest.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<PaymentRequest>(model);
    }

    async createPaymentRequest(data: ICreatePaymentRequestDto, key: AccessKey, options?: ExecutionOptions) {
        const business = await this.businessService.safeGet(key.businessId, this.request);

        await this.ensureCanCreate(business, data);

        const account = await this.getPayinAccount(business, data);

        if (data.method == PaymentRequestMethod.BankTransfer) {
            return this.createPaymentRequestBankTransfer(
                business,
                account,
                data as CreatePaymentRequestBankTransferDto,
                options,
            );
        }

        return this.createPaymentRequestPaymentAuthorization(
            business,
            account,
            data as CreatePaymentRequestPaymentAuthorizationDto,
            options,
        );
    }

    async createPaymentRequestBankTransfer(
        business: HydratedDocument<Business>,
        account: HydratedDocument<Account>,
        data: CreatePaymentRequestBankTransferDto,
        options?: ExecutionOptions,
    ) {
        const customer = await this.customerService.fetchCustomer(business.id, data.customer);
        const depositChannel = await this.rotateDynamicDepositChannel(
            business.id,
            data.options.bankTransfer.accountName,
            options,
        );

        const entity = Utils.removeNilValues<PaymentRequest>({
            business: business.id,
            description: data.description,
            customer: customer?.id,
            status: PaymentRequestStatus.Pending,
            reference: data.reference,
            amount: data.amount,
            currency: data.currency,
            account: account._id,
            method: data.method,
            methodData: { depositChannel },
            expiresAt: addMinutes(new Date(), 30),
            //metadata: data.metadata,
        });

        return this.createEntity(entity, options);
    }

    async createPaymentRequestPaymentAuthorization(
        business: HydratedDocument<Business>,
        account: HydratedDocument<Account>,
        data: CreatePaymentRequestPaymentAuthorizationDto,
        options?: ExecutionOptions,
    ) {
        // Payment authorization module deleted — not in MOR plan
        throw AppException.BadRequest.setMessage('Direct debit not supported');
    }

    private async createEntity(entity: Partial<PaymentRequest>, options?: ExecutionOptions) {
        try {
            const paymentRequest = await this.repo.createAndSave(entity, options);
            return paymentRequest;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable;
        }
    }

    async findByIdOrReference(businessId: Types.ObjectId, id: string, query: APIPagingDto) {
        const paymentReqId = ParseTagId(id, [ModelIdTag.PaymentRequest]);
        if (paymentReqId) {
            return this.repo.findOneWithOptions({
                conditions: { _id: paymentReqId },
                expand: query.expand,
                select: query.select,
            });
        }

        return this.repo.findOneWithOptions({
            conditions: { reference: id, business: businessId },
            expand: query.expand,
            select: query.select,
        });
    }

    // TODO: Recycle deposit bank account name
    async rotateDynamicDepositChannel(businessId: Types.ObjectId, name: string, options: ExecutionOptions) {
        const depositChannel = await this.accountService.createDynamicDepositChannel(
            businessId,
            DepositChannelType.BankAccount,
            name,
            options,
        );

        if (!depositChannel) {
            throw AppException.ServiceUnavailable.setMessage('Payment method is not available');
        }

        return depositChannel;
    }

    async getPayinAccount(
        business: HydratedDocument<Business>,
        data: ICreatePaymentRequestDto,
    ): Promise<HydratedDocument<Account>> {
        if (data.account) {
            return this.accountService.safeGet(business.id, data.account);
        }

        const config = await this.configurationService.get(business, 'payment');
        if (config?.payment?.payInAccount) {
            return this.accountService.safeGet(business.id, config.payment.payInAccount);
        }

        return this.accountService.safeGetMainDefault(business.id, toAccountCurrency(data.currency));
    }

    private async ensureCanCreate(business: HydratedDocument<Business>, data: ICreatePaymentRequestDto) {
        if (!data.reference) {
            return;
        }

        const count = await this.repo.count({ reference: data.reference, business: business.id });
        if (count > 0) {
            throw AppException.ReferenceConflict;
        }
    }
}
