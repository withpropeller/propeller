import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { Approval, ApprovalData, ApprovalStatus, ApprovalTypes } from './approvals.schema';
import { Repository } from '@core/abstracts/repository';
import { NotificationSenders, NotificationTemplates, TenantDataSource } from '@core/helpers';
import { ReporterService } from '@common/services/reporter.service';
import { Business } from '@api/business/business.schema';
import { User } from '@api/users/user.schema';
import { BusinessStatus } from '@api/business/business.enums';
import { BusinessException } from '@api/business/business.exception';
import { BusinessService } from '@api/business';
import { UsersService } from '@api/users';
import { ExtractEmailNotificationTo } from '@core/jobs/notification.job';
import { ApprovalException } from './approval.exception';
import { NotificationHandler } from '@common/notifications/notification-handler.service';

@Injectable()
export class ApprovalService extends Repository<Approval> {
    constructor(
        @InjectModel(Approval.name, TenantDataSource.Core) readonly model: Model<HydratedDocument<Approval>>,
        private readonly reporterService: ReporterService,
        private readonly userService: UsersService,
        private readonly businessService: BusinessService,
        private notificationHandler: NotificationHandler,
    ) {
        super(model);
    }

    async ensureNoPendingApproval(businessId: string, type: ApprovalTypes) {
        const approval = await this.findOne({ business: businessId, type, status: ApprovalStatus.Pending }, true);

        if (approval) {
            throw ApprovalException.Pending;
        }
    }

    async request(
        user: HydratedDocument<User>,
        business: HydratedDocument<Business>,
        type: ApprovalTypes,
        data?: ApprovalData,
    ) {
        const doc = await this.createAndSave({ requestedBy: user, business, data, type });

        const slackData = {
            message: `${user.firstName} ${user.lastName}(${user.email}) from (${business.name}) just requested a ${type} approval`,
            data,
        };

        this.reporterService.pushInfo(slackData);

        return doc;
    }

    async requestBusinessAccountApproval(userPublicId: string, businessId: string) {
        const user = await this.userService.findOneById(userPublicId);
        const business = await this.businessService.findOneById(businessId);

        // ensure no pending approval
        await this.ensureNoPendingApproval(business.id, ApprovalTypes.BusinessAccount);

        if (business.status !== BusinessStatus.NOT_APPROVED) {
            throw BusinessException.BusinessApprovalUnavailable;
        }

        business.status = BusinessStatus.REQUESTED;

        // update business status
        await this.businessService.save(business);

        // create approval event request
        await this.request(user, business, ApprovalTypes.BusinessAccount);

        // send emails
        await this.handleApprovalRequestedEmail(user, business);
    }

    private async handleApprovalRequestedEmail(
        user: HydratedDocument<User>,
        business: HydratedDocument<Business>,
    ): Promise<void> {
        const content: Record<string, any> = {
            email: user.email,
            firstName: user.firstName,
            businessName: business.name,
        };

        // Send user email
        this.notificationHandler.handle(
            NotificationTemplates.BusinessApprovalRequested,
            ExtractEmailNotificationTo(user),
            content,
        );

        // Send admin email
        this.notificationHandler.handle(
            NotificationTemplates.ApprovalRequestEvent,
            { email: NotificationSenders.SUPPORT },
            content,
        );
    }
}
