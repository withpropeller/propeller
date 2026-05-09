import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Utils, AccountStatus, AppMessages, TenantDataSource } from '@core/helpers';
import { SCryptCryptoFactory } from '@core/crypto';
import { AuthException } from './auth.exception';
import { SigninDto } from './dto/signin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivateAccountDto } from './dto/activate-account';
import { MultiFactorAuth } from './multi-factor.auth';
import { AuthErrors, TwoFAChannels } from './auth.enums';
import { HydratedDocument, Types } from 'mongoose';
import { EventTask, EventPublisher, EventTasks } from '@core/events';
import { UserConsumer } from '@api/users/user.consumer';
import { JWTUser } from './jwt.strategy';
import { AdminService } from '@api/admins/admin.service';
import { Admin } from '@api/admins/admin.schema';
import { InviteUserDto } from './dto/invite-user.dto';
import { RolesService } from '@api/roles/roles.service';
import { AppException } from '@core/exceptions';
import { AdminConsumer } from '@api/admins/admin.consumer';

export type UserWithAccessToken = { user: Admin; accessToken: string };

@Injectable()
export class AuthService {
    // How long we wait for the user to click confirmation token when creating a new account

    constructor(
        private adminService: AdminService,
        private rolesService: RolesService,
        private eventPublisher: EventPublisher,
        private jwt: JwtService,
        private twoFactorAuth: MultiFactorAuth,
    ) {}

    async confirmEmail(user: JWTUser) {
        const update = { emailConfirmed: true, status: AccountStatus.ACTIVE };
        await this.adminService.updateById(user.userId, { $set: update });
    }

    async sendEmailConfirmation(email?: string) {
        const user = await this.adminService.findOneByEmail(email);

        if (!user) {
            throw new NotFoundException('Account Not Found');
        }

        // change email if supplied
        if (email) {
            user.email = email;
            await this.adminService.save(user);
        }

        // set a session token
        const sessionToken = await this.setStateToken(user.id);

        // Send confirmation email
        const data = { user, sessionToken };
        const event = new EventTask(UserConsumer.NAME, EventTasks.UserConfirmEmail, TenantDataSource.Core, data);
        this.eventPublisher.publish(event);
    }

    async getAuthToken(data: SigninDto) {
        const user = await this.adminService.findOne({ email: data.email }, true);

        if (!user) {
            throw new NotFoundException(`Account not found`);
        }

        // authenticate password
        await this.adminService.authenticateCredentials(user, data.password);

        if (!this.twoFactorAuth.hasMFA(user)) {
            return this.authenticatedUser(user);
        }

        if (data.token) {
            const isValid = this.twoFactorAuth.verifyTOTPSecret(user, data.mfaChannel, data.token);

            if (isValid) {
                return this.authenticatedUser(user);
            }

            throw AuthException.INVALID_TOKEN;
        }

        // set security
        const stateToken = await this.setStateToken(user.id);
        const userJson = user.toObject();

        // Send MFA if EMAIL
        const defaultMFA = userJson.multiFactors.find((v) => v.default);

        if (defaultMFA && defaultMFA.channel === TwoFAChannels.Email) {
            this.twoFactorAuth.send2FAToken(user, defaultMFA);
        }

        const multiFactors = Utils.pickKeys(userJson.multiFactors, '-secret -recoveryKeyHash');

        return {
            code: AuthErrors.MfaRequired,
            message: 'MFA Required',
            data: { multiFactors, stateToken },
        };
    }

    async setStateToken(userId: Types.ObjectId, isMobileFriendly = false): Promise<string> {
        return this.adminService.setStateToken(userId, isMobileFriendly);
    }

    async sendResetPasswordToken(data: ForgotPasswordDto) {
        const user = await this.adminService.findOneByEmail(data.email);

        // set session token
        const sessionToken = await this.setStateToken(user.id);

        // Send reset email
        const event = new EventTask(UserConsumer.NAME, EventTasks.UserResetPasswordEmail, TenantDataSource.Core, {
            user,
            sessionToken,
        });
        this.eventPublisher.publish(event);
    }

    async changePassword(publicId: Types.ObjectId, data: ChangePasswordDto) {
        const user = await this.adminService.safeFindOneById(publicId);

        // Authenticate old password
        await this.adminService.authenticateCredentials(user, data.oldPassword);

        if (!this.twoFactorAuth.hasMFA(user)) {
            await this.adminService.changePassword(user.id, data.newPassword);
            return AppMessages.PASSWORD_RESET_SUCCESSFUL;
        }

        if (data.token) {
            const isValid = this.twoFactorAuth.verifyTOTPSecret(user, data.mfaChannel, data.token);

            if (isValid) {
                await this.adminService.changePassword(user.id, data.newPassword);
                return AppMessages.PASSWORD_RESET_SUCCESSFUL;
            }

            throw AuthException.INVALID_TOKEN;
        }

        // set security
        const stateToken = await this.setStateToken(user.id);
        const userJson = user.toObject();

        // Send MFA if EMAIL
        const defaultMFA = userJson.multiFactors.find((v) => v.default);

        if (defaultMFA && defaultMFA.channel === TwoFAChannels.Email) {
            this.twoFactorAuth.send2FAToken(user, defaultMFA);
        }

        const multiFactors = Utils.pickKeys(userJson.multiFactors, '-secret -recoveryKeyHash');

        return {
            code: AuthErrors.MfaRequired,
            message: 'MFA Required',
            data: { multiFactors, stateToken },
        };
    }

    async resetPasswordByToken(userId: Types.ObjectId, data: ResetPasswordDto) {
        return this.adminService.changePassword(userId, data.newPassword);
    }

    async inviteUser(adminPublicId: Types.ObjectId, data: InviteUserDto) {
        const admin = await this.adminService.findById(adminPublicId);

        // check if user exist on allawee
        const user = await this.adminService.findOneByEmail(data.email, true);

        if (!user) {
            const invitedUser = await this.createBareAccount(data.email, data.roles);
            const sessionToken = await this.setStateToken(invitedUser.id);
            const event = new EventTask(AdminConsumer.NAME, EventTasks.AdminInvitationEmail, TenantDataSource.Core, {
                admin,
                user: invitedUser,
                sessionToken,
            });
            this.eventPublisher.publish(event);
            return;
        }

        if (user && user.status === AccountStatus.REQUIRES_ACTIVATION) {
            const sessionToken = await this.setStateToken(user.id);
            const event = new EventTask(AdminConsumer.NAME, EventTasks.AdminInvitationEmail, TenantDataSource.Core, {
                admin,
                user,
                sessionToken,
            });
            this.eventPublisher.publish(event);
            return;
        }

        throw AuthException.USER_ALREADY_EXIST;
    }

    async createBareAccount(email: string, roleSlugs: string[]): Promise<HydratedDocument<Admin>> {
        const roles = await this.rolesService.fetchRolesBySlugsFromCache(roleSlugs);
        const roleIds = roles.map((v) => v._id);

        if (roleIds.length === 0) {
            throw AppException.BadRequest.setMessage('User must have a valid role');
        }

        const entity = this.adminService.createPartial({
            email,
            status: AccountStatus.REQUIRES_ACTIVATION,
        });
        entity.roles = roleIds as any;

        return this.adminService.createAndSave(entity);
    }

    async activateAccount(publicId: Types.ObjectId, data: ActivateAccountDto): Promise<UserWithAccessToken> {
        const user = await this.adminService.findById(publicId);

        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.passwordHash = await SCryptCryptoFactory.hash(data.password);
        user.emailConfirmed = true;
        user.status = AccountStatus.ACTIVE;

        // save user
        await this.adminService.save(user);

        // Send activation success email
        const event = new EventTask(AdminConsumer.NAME, EventTasks.AdminActivatedEmail, TenantDataSource.Core, {
            user,
        });
        this.eventPublisher.publish(event);

        return this.authenticatedUser(user);
    }

    async getAccountInfo(publicId: string): Promise<HydratedDocument<Admin>> {
        return this.adminService.findOneAndPopulate({ _id: publicId }, 'business');
    }

    private authenticatedUser(user: HydratedDocument<Admin>): UserWithAccessToken {
        // Create  token
        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.roles,
        };

        // lets create the token
        const accessToken = this.jwt.sign(payload);

        return { accessToken, user };
    }
}
