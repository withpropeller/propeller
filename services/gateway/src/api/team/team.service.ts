import { Injectable } from '@nestjs/common';
import { HydratedDocument, Types } from 'mongoose';
import { APIPagingData, APIPagingDto } from '@common/api-paging';
import { BusinessService } from '@api/business/business.service';
import { UsersService } from '@api/users';
import { AccountStatus, MongoIdEquals, NotificationTemplates, Utils } from '@core/helpers';
import { NotificationHandler } from '@common/notifications/notification-handler.service';
import { ConfigService } from '@config/config.service';
import { AuthException } from '@auth/auth.exception';
import { Business } from '@api/business/business.schema';
import { User } from '@api/users/user.schema';
import { TeamInviteUserDto } from './team.dto';

@Injectable()
export class TeamService {
    constructor(
        private readonly businessService: BusinessService,
        private readonly usersService: UsersService,
        private readonly notificationHandler: NotificationHandler,
        private readonly config: ConfigService,
    ) {}

    async inviteUser(businessId: Types.ObjectId, data: TeamInviteUserDto, adminUserId: Types.ObjectId) {
        const admin = await this.usersService.findById(adminUserId);
        const business = await this.businessService.findById(businessId);

        const user = await this.usersService.findOneByEmail(data.email, true);

        if (!user) {
            const invitedUser = await this.usersService.createBareAccount(data.email, business.id, data.roles);
            const stateToken = await this.usersService.setStateToken(invitedUser.id);
            await this.sendInvitationEmail(admin, invitedUser, business, stateToken);
            return;
        }

        if (MongoIdEquals(user.business, business._id) && user.status === AccountStatus.RequiresActivation) {
            const stateToken = await this.usersService.setStateToken(user.id);
            await this.sendInvitationEmail(admin, user, business, stateToken);
            return;
        }

        throw AuthException.USER_ALREADY_EXIST;
    }

    async revokeInvite(businessId: Types.ObjectId, userId: Types.ObjectId) {
        const user = await this.usersService.findOne({
            _id: userId,
            business: businessId,
            status: AccountStatus.RequiresActivation,
        });

        return this.usersService.deleteById(user.id);
    }

    async getMembers(businessId: Types.ObjectId, query: APIPagingDto): Promise<APIPagingData<User>> {
        const business = await this.businessService.findById(businessId);

        return this.usersService.findByQuery(query, { business: business._id });
    }

    async deactivateMember(businessId: Types.ObjectId, userId: Types.ObjectId) {
        const user = await this.usersService.findOne({
            _id: userId,
            business: businessId,
            status: AccountStatus.Active,
        });

        return this.usersService.updateById(user._id, { status: AccountStatus.Suspended });
    }

    private async sendInvitationEmail(
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
}
