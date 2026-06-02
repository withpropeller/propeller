import { UsersService } from '@api/users';
import { APIPagingData, APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { ConfigService } from '@config/config.service';
import { AccountStatus, TenantDataSource, MongoIdEquals, NotificationTemplates, Utils } from '@core/helpers';
import { NotificationHandler } from '@common/notifications/notification-handler.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { InviteUserDto } from './business.dto';
import { Business } from './business.schema';
import { Repository } from '@core/abstracts/repository';
import { User } from '@api/users/user.schema';
import { RolesService } from '@api/roles/roles.service';
import { AuthException } from '@auth/auth.exception';
import { OnboardSurvey } from '@auth/onboard/onboard-survey.schema';
import { BusinessStatus } from './business.enums';
import { ExtractEmailNotificationTo } from '@core/jobs/notification.job';
import { RoleSlugs } from '@api/roles/roles.enums';
import { AccountService } from '@api/account/account.service';
import { ConfigurationService } from '@api/configuration/configuration.service';

@Injectable()
export class BusinessService extends Repository<Business> {
    constructor(
        @InjectModel(Business.name, TenantDataSource.Core) model: Model<HydratedDocument<Business>>,
        private userService: UsersService,
        private notificationHandler: NotificationHandler,
        private config: ConfigService,
        private readonly rolesService: RolesService,
        private accountService: AccountService,
        private configurationService: ConfigurationService,
    ) {
        super(model);
    }

    async create(user: HydratedDocument<User>, onboard: OnboardSurvey) {
        //fetch owner role
        const role = await this.rolesService.findByRoleSlugFromCache(RoleSlugs.Owner);

        // Create business
        const business = await this.createAndSave({ owner: user, name: onboard.businessName, onboardSurvey: onboard });

        // Update user with owner role
        await this.userService.updateByObjectId(user._id, { business: business._id, roles: [role._id] });

        return business;
    }

    // Create Sandbox Main Account and Configuration Objects
    async initiateSandbox(business: HydratedDocument<Business>, businessName: string) {
        const mainAccount = await this.accountService.createDefaultMainAccount(business, businessName);
        await this.configurationService.create(business, mainAccount);
    }

    async getBusinessMembers(businessId: any, query: APIPagingDto): Promise<APIPagingData<User>> {
        const business = await this.findById(businessId);

        return this.userService.findByQuery(query, { business: business._id });
    }

    async inviteUser(businessId: Types.ObjectId, data: InviteUserDto, adminPublicId: Types.ObjectId) {
        const admin = await this.userService.findById(adminPublicId);
        const business = await this.findById(businessId);

        // check if user exist on allawee
        const user = await this.userService.findOneByEmail(data.email, true);

        if (!user) {
            const invitedUser = await this.userService.createBareAccount(data.email, business.id, data.roles);
            const stateToken = await this.userService.setStateToken(invitedUser.id);
            await this.handleInvitationEmail(admin, invitedUser, business, stateToken);
            return;
        }

        if (user && MongoIdEquals(user.business, business._id) && user.status === AccountStatus.RequiresActivation) {
            const stateToken = await this.userService.setStateToken(user.id);
            await this.handleInvitationEmail(admin, user, business, stateToken);
            return;
        }

        throw AuthException.USER_ALREADY_EXIST;
    }

    async revokeInvite(businessId: Types.ObjectId, userId: Types.ObjectId) {
        const user = await this.userService.findOne({
            _id: userId,
            business: businessId,
            status: AccountStatus.RequiresActivation,
        });

        return this.userService.deleteById(user.id);
    }

    private async handleInvitationEmail(
        admin: User,
        user: User,
        business: HydratedDocument<Business>,
        sessionCode: string,
    ): Promise<void> {
        const firstName = user.firstName ? user.firstName : Utils.toTitleCase(user.email.split('@')[0]);
        const to = { email: { id: user.email, name: firstName } };

        const authLink = `${this.config.APP_DOMAIN}/invite/${business._id}/${sessionCode}`;

        const content: Record<string, any> = {
            adminFirstName: admin.firstName,
            businessName: business.name,
            email: user.email,
            authLink,
            firstName,
        };

        this.notificationHandler.handle(NotificationTemplates.TeamInvite, to, content);
    }

    private async handleKYCPromptEmail(admin: User, user: User, business: HydratedDocument<Business>): Promise<void> {
        const redirectLink = `${this.config.APP_DOMAIN}/company/profile`;

        const content: Record<string, any> = {
            firstName: user.firstName,
            adminFirstName: admin.firstName,
            businessName: business.name,
            email: user.email,
            redirectLink,
        };

        this.notificationHandler.handle(
            NotificationTemplates.KycPromptEmail,
            ExtractEmailNotificationTo(user),
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
                                    approvalStatus: BusinessStatus.APPROVED,
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
