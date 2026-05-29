import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from '@core/abstracts';
import { Billing } from './billing.schema';
import { TenantDataSource } from '@core/helpers';
import { Model, HydratedDocument, Types } from 'mongoose';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { Business } from '@api/business/business.schema';
import { buildBillingCVData } from './billing.utils';
import { stringify } from 'csv-stringify/sync';
import { format } from 'date-fns';
import { ExecutionOptions } from '@common/interfaces';
import { AdminService } from '@api/admins/admin.service';
import { BillingStatus } from './billing.enums';
import { BillingException } from './billing.exception';
import { Account } from '@api/account/accounts.schema';
import { ConfigurationService } from '@api/configuration/configuration.service';
import { AccountService } from '@api/account/account.service';
import { AccountType } from '@api/account/account.enums';
import { PaymentService } from '@api/payments/payment.service';
import { Request } from 'express';
import { MetricsQueryDto } from '@common/dtos';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class BillingService extends Repository<Billing> {
    constructor(
        @InjectModel(Billing.name, TenantDataSource.Live) readonly model: Model<HydratedDocument<Billing>>,
        @InjectModel(Business.name, TenantDataSource.Core) private businessModel: Model<HydratedDocument<Business>>,
        private readonly adminService: AdminService,
        private readonly configurationService: ConfigurationService,
        private readonly accountService: AccountService,
        private readonly paymentService: PaymentService,
    ) {
        super(model);
    }

    getAll(query: APIPagingDto) {
        return this.findByQuery(query, {}, [], [{ path: 'business', model: this.businessModel }]);
    }

    getOne(id: Types.ObjectId, query: APIPagingDto) {
        return this.findOneWithOptions({
            conditions: { _id: id },
            select: query.select,
            expand: query.expand,
            populate: [{ path: 'business', model: this.businessModel }],
        });
    }

    public async getCSV(query: APIPagingDto) {
        const { conditions } = MongoAPIPaging.getPagingConstraints(query);
        const res = await this.findWithOptions({
            conditions,
            expand: 'business:name,email,id',
            populate: [{ path: 'business', model: this.businessModel }],
            select: 'business status dueDate invoiceNo period currency billedAmount invoicePdf',
        });

        const entries = res.map((v) => buildBillingCVData(v));

        const columns = [
            { key: 'id', header: 'ID' },
            { key: 'status', header: 'Status' },
            { key: 'currency', header: 'Currency' },
            { key: 'businessName', header: 'Business Name' },
            { key: 'businessEmail', header: 'Business Email' },
            { key: 'invoiceNo', header: 'Invoice No' },
            { key: 'period', header: 'Period' },
            { key: 'dueDate', header: 'Due Date' },
            { key: 'billedAmount', header: 'Billed Amount' },
            { key: 'billedAmountMoney', header: 'Billed Amount (Money)' },
            { key: 'invoicePdf', header: 'Invoice PDF URL' },
        ];

        const csv = stringify(entries, { header: true, columns, quoted_string: true });
        const fileName = `hyphen-billing-generated-${format(new Date(), 'yyyy-MM-dd')}.csv`;

        return [csv, fileName];
    }

    async charge(adminId: Types.ObjectId, billingId: Types.ObjectId, req: Request, options?: ExecutionOptions) {
        const admin = await this.adminService.safeFindOneById(adminId);
        const billing = await this.findById(billingId);

        if (billing.status !== BillingStatus.Due) {
            throw BillingException.BillingNotDue;
        }

        // get the billing account
        const billingAccount = await this.getBillingAccount(billing.business);

        // charge the billing
        await this.paymentService.chargeBilling(admin, billing, billingAccount, req, options);
    }

    private async getBillingAccount(businessId: Types.ObjectId): Promise<HydratedDocument<Account>> {
        const billing = await this.configurationService.repo.findOne({ business: businessId });
        if (!billing.billing?.account) {
            return this.accountService.repo.findOne({ business: businessId, type: AccountType.Main, default: true });
        }

        return await this.accountService.repo.findById(billing.billing.account);
    }

    async getMetrics(query: MetricsQueryDto) {
        const matchStage: Record<string, any> = {};
        if (query.from || query.to) {
            matchStage.createdAt = {};
            if (query.from) matchStage.createdAt.$gte = new Date(query.from);
            if (query.to) matchStage.createdAt.$lte = new Date(query.to);
        }

        const [result] = await this.aggregate([
            ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    byCurrency: [
                        {
                            $group: {
                                _id: '$currency',
                                totalBilledAmount: { $sum: '$billedAmount' },
                                count: { $sum: 1 },
                            },
                        },
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
                    byCurrency: '$byCurrency',
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byStatus: {}, byCurrency: [], total: 0 };
    }
}
