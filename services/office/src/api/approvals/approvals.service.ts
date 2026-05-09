import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Approval, ApprovalStatus, ApprovalTypes } from './approvals.schema';
import { Repository } from '@core/abstracts/repository';
import { TenantDataSource } from '@core/helpers';
import { ReporterService } from '@common/services/reporter.service';
import { BusinessService } from '@api/business';
import { ApprovalException } from './approval.exception';
import { AdminService } from '@api/admins/admin.service';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { Request } from 'express';
import { ExecutionOptions } from '@common/interfaces';
import { AccountService } from '@api/account/account.service';

@Injectable()
export class ApprovalService extends Repository<Approval> {
    constructor(
        @InjectModel(Approval.name, TenantDataSource.Core)
        readonly model: Model<HydratedDocument<Approval>>,
        private readonly reporterService: ReporterService,
        private readonly adminService: AdminService,
        private readonly businessService: BusinessService,
        private readonly accountService: AccountService,
        private auditService: AdminAuditService,
    ) {
        super(model);
    }

    async accept(
        adminId: Types.ObjectId,
        approvalId: Types.ObjectId,
        data: Record<string, string>,
        req: Request,
        options?: ExecutionOptions,
    ) {
        const approval = await this.findOneAndPopulate({ _id: approvalId }, 'requestedBy');
        const business = await this.businessService.findOneAndPopulate({ _id: approval.business }, 'kyc');

        if (approval.status == ApprovalStatus.Processing) {
            throw ApprovalException.Processing;
        }

        if (approval.status !== ApprovalStatus.Pending) {
            throw ApprovalException.DecisionAlreadyMade;
        }

        const admin = await this.adminService.findById(adminId);

        // update the approval state
        await this.updateById(approval.id, {
            status: ApprovalStatus.Processing,
            systemApprover: admin._id,
        });

        // perform the accept action
        await this.getAcceptAction(approval, data);

        // update the approval state
        await this.updateById(approval.id, {
            status: ApprovalStatus.Approved,
            systemApprover: admin._id,
            decisionDate: Date.now(),
        });

        const reportMessage = `${admin.firstName} ${admin.lastName}(${admin.email}) approved ${approval.type} request from ${business.name}`;
        await this.auditService.registerApprovalAccept(approval.id, admin, req, options, reportMessage);
    }

    async decline(adminId: Types.ObjectId, approvalId: Types.ObjectId, req: Request, options?: ExecutionOptions) {
        const approval = await this.findOne({ _id: approvalId });
        const business = await this.businessService.findOne({
            _id: approval.business,
        });

        if (approval.status !== ApprovalStatus.Pending) {
            throw ApprovalException.DecisionAlreadyMade;
        }

        const admin = await this.adminService.findById(adminId);

        if (approval.type === ApprovalTypes.BusinessAccount) {
            await this.businessService.decline(business.id, options);
        }

        await this.updateById(
            approval.id,
            {
                status: ApprovalStatus.Declined,
                systemApprover: admin.id,
                decisionDate: Date.now(),
            },
            options,
        );

        const reportMessage = `${admin.firstName} ${admin.lastName}(${admin.email}) declined ${approval.type} request from ${approval.business.name} `;
        await this.auditService.registerApprovalAccept(approval.id, admin, req, options, reportMessage);
    }

    async reverse(approvalId: Types.ObjectId, adminUserId: Types.ObjectId) {
        const approval = await this.findOneAndPopulate({ _id: approvalId }, 'business');

        if (approval.status !== ApprovalStatus.Processing) {
            throw ApprovalException.DecisionAlreadyMade;
        }

        if (approval.type !== ApprovalTypes.BusinessAccount) {
            throw ApprovalException.CannotBeReversed;
        }

        const adminUser = await this.adminService.findById(adminUserId);

        await this.updateById(approval.id, {
            status: ApprovalStatus.Pending,
        });

        const slackData = {
            message: `${adminUser.firstName} ${adminUser.lastName}(${adminUser.email}) reversed ${approval.type} request from ${approval.business.name} to PENDING`,
        };

        this.reporterService.pushInfo(slackData);
    }

    getAcceptAction(approval: HydratedDocument<Approval>, data: Record<string, string>) {
        switch (approval.type) {
            case ApprovalTypes.BusinessAccount:
                return this.businessService.approveAccount(approval, data as any);
            case ApprovalTypes.CreditLimit:
                return this.accountService.approveOverdraft(approval, data as any);
        }
    }
}
