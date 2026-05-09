import { UsersService } from '@api/users';
import { APIPagingData, APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { TenantDataSource, NotificationTemplates } from '@core/helpers';
import { NotificationHandler } from '@common/notifications/notification-handler.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { ApproveBusinessDto } from './business.dto';
import { MetricsQueryDto } from '@common/dtos';
import { Business } from './business.schema';
import { Repository } from '@core/mongo';
import { User } from '@api/users/user.schema';
import { BusinessStatus } from './business.enums';
import { ExtractNotificationTo } from '@core/jobs/notification.job';
import { AccountService } from '@api/account/account.service';
import { Approval } from '@api/approvals/approvals.schema';
import { ApprovalException } from '@api/approvals/approval.exception';
import { ConfigurationService } from '@api/configuration/configuration.service';
import { ParamValidationPipe } from '@core/pipes/param-validation.pipe';
import { ExecutionOptions } from '@common/interfaces';

@Injectable()
export class BusinessService extends Repository<Business> {
    constructor(
        @InjectModel(Business.name, TenantDataSource.Core)
        model: Model<HydratedDocument<Business>>,
        private userService: UsersService,
        private notificationHandler: NotificationHandler,
        private accountService: AccountService,
        private configurationService: ConfigurationService,
    ) {
        super(model, { searchFields: ['name'] });
    }

    async approveAccount(approval: HydratedDocument<Approval>, data: ApproveBusinessDto) {
        await ParamValidationPipe.ensureParams(ApproveBusinessDto, data);

        const business = await this.findOneAndPopulate({ _id: approval.business }, 'kyc');

        // validate organization
        if (business.onboardSurvey && business.kyc) {
            await this.initiateLive(business, data.accountName);
            await this.updateById(business.id, {
                status: BusinessStatus.Approved,
            });

            return this.handleApprovalSuccessfulEmail(approval.requestedBy, business);
        }

        throw ApprovalException.CannotApprove;
    }

    // Create Live Main Account and Configuration Objects
    async initiateLive(business: HydratedDocument<Business>, businessName: string) {
        const mainAccount = await this.accountService.createDefaultMainAccount(business, businessName);
        await this.configurationService.create(business, mainAccount);
    }

    // Create Sandbox Main Account
    async initiateSandbox(businessId: Types.ObjectId, options: ExecutionOptions) {
        const business = await this.findById(businessId, { expand: 'onboardSurvey' });

        const mainAccount = await this.accountService.createDefaultMainAccount(
            business,
            business.onboardSurvey.businessName,
            options,
        );
        await this.configurationService.create(business, mainAccount);
    }

    async decline(businessId: Types.ObjectId, options?: ExecutionOptions) {
        const business = await this.findById(businessId);

        await this.updateById(
            businessId,
            {
                status: BusinessStatus.NOT_APPROVED,
            },
            options,
        );

        return this.handleApprovalDeclineEmail(business);
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
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byStatus: {}, total: 0 };
    }

    async getBusinessMembers(businessId: any, query: APIPagingDto): Promise<APIPagingData<User>> {
        const business = await this.findById(businessId);

        return this.userService.findByQuery(query, { business: business._id });
    }

    private async handleApprovalSuccessfulEmail(user: User, business: Business): Promise<void> {
        const content: Record<string, any> = {
            email: user.email,
            firstName: user.firstName,
            businessName: business.name,
        };
        this.notificationHandler.handle(
            NotificationTemplates.BusinessApprovalAccepted,
            ExtractNotificationTo(user),
            content,
        );
    }

    private async handleApprovalDeclineEmail(business: Business): Promise<void> {
        const user = business.owner;

        const content: Record<string, any> = {
            email: user.email,
            firstName: user.firstName,
            businessName: business.name,
        };

        this.notificationHandler.handle(
            NotificationTemplates.BusinessApprovalDeclined,
            ExtractNotificationTo(user),
            content,
        );
    }

    async memberCounts(organizationId: string) {
        return await this.userService.orgMemberCount(organizationId);
    }

    async disableBusiness(organization: any) {
        return await this.updateOne(
            { _id: organization },
            {
                status: BusinessStatus.NOT_APPROVED,
            },
        );
    }

    async orgStats(query: APIPagingDto) {
        const { conditions } = MongoAPIPaging.getPagingConstraints(query);

        const resp = await this.model
            .aggregate([
                {
                    $facet: {
                        total: [{ $match: conditions }, { $count: 'count' }],
                        approved: [
                            {
                                $match: {
                                    approvalStatus: BusinessStatus.Approved,
                                    ...conditions,
                                },
                            },
                            { $count: 'count' },
                        ],
                        unapproved: [
                            {
                                $match: {
                                    approvalStatus: BusinessStatus.NOT_APPROVED,
                                    ...conditions,
                                },
                            },
                            { $count: 'count' },
                        ],
                        requested: [
                            {
                                $match: {
                                    approvalStatus: BusinessStatus.REQUESTED,
                                    ...conditions,
                                },
                            },
                            { $count: 'count' },
                        ],
                    },
                },
                {
                    $project: {
                        total: {
                            $arrayElemAt: ['$total.count', 0],
                        },
                        approved: {
                            $arrayElemAt: ['$approved.count', 0],
                        },
                        unapproved: {
                            $arrayElemAt: ['$unapproved.count', 0],
                        },
                        requested: {
                            $arrayElemAt: ['$requested.count', 0],
                        },
                    },
                },
            ])
            .exec();

        const response = resp[0];

        return { ...response };
    }
}
