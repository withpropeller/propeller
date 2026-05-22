import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Utils, AccountStatus, AppMessages } from '@core/helpers';
import { SCryptCryptoFactory } from '@core/crypto';
import { AuthException } from './auth.exception';
import { SigninDto } from './dto/signin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { BusinessService } from '@api/business/business.service';
import { ActivateAccountDto } from './dto/activate-account';
import { User } from '@api/users/user.schema';
import { UsersService } from '@api/users/users.service';
import { OnboardSurvey } from './onboard/onboard-survey.schema';
import { MultiFactorAuth } from './multi-factor.auth';
import { AuthErrors, TwoFAChannels } from './auth.enums';
import { HydratedDocument } from 'mongoose';
import { JWTUser } from './jwt.strategy';
import { EventTask, EventTasks } from '@core/events';
import { ExecutionOptions } from '@core/interfaces';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TenantDataSource } from '@core/helpers';

export type UserWithAccessToken = { user: User; accessToken: string };

@Injectable()
export class AuthService {
    // How long we wait for the user to click confirmation token when creating a new account

    constructor(
        private usersService: UsersService,
        private jwt: JwtService,
        private businessService: BusinessService,
        private twoFactorAuth: MultiFactorAuth,
        private eventEmitter: EventEmitter2,
    ) {}

    async signup(onboard: OnboardSurvey, options?: ExecutionOptions): Promise<User> {
        const entity = this.usersService.createPartial({});
        entity.email = onboard.email;
        entity.firstName = onboard.firstName;
        entity.lastName = onboard.lastName;
        entity.passwordHash = onboard.passwordHash;

        const user = await this.usersService.create(entity);

        // create user's default organization and add to organization
        await this.businessService.create(user, onboard);

        this.eventEmitter.emit(
            EventTasks.UserSignedUp,
            new EventTask(EventTasks.UserSignedUp, TenantDataSource.Sandbox, { user, onboard }, options),
        );

        return user;
    }

    async confirmEmail(user: JWTUser) {
        const update = { emailConfirmed: true, status: AccountStatus.ACTIVE };
        await this.usersService.updateById(user.userId, { $set: update });

        // TigerBeetle/ledger accounts are created on business activation (post-KYB)
        // initiateSandbox() is triggered by the PayKKa webhook when kyb_status = approved
    }

    async sendEmailConfirmation(email?: string) {
        const user = await this.usersService.findOneByEmail(email);

        if (!user) {
            throw new NotFoundException('Account Not Found');
        }

        // change email if supplied
        if (email) {
            user.email = email;
            await this.usersService.save(user);
        }

        this.eventEmitter.emit(
            EventTasks.UserEmailConfirmRequested,
            new EventTask(EventTasks.UserEmailConfirmRequested, TenantDataSource.Sandbox, { user }),
        );
    }

    async getAuthToken(data: SigninDto) {
        const user = await this.usersService.findOne({ email: data.email }, true);

        if (!user) {
            throw new NotFoundException(`Account not found`);
        }

        // authenticate password
        await this.usersService.authenticateCredentials(user, data.password);

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

    async setStateToken(userId: string, isMobileFriendly = false): Promise<string> {
        return this.usersService.setStateToken(userId, isMobileFriendly);
    }

    async sendResetPasswordToken(data: ForgotPasswordDto) {
        const user = await this.usersService.findOneByEmail(data.email);

        this.eventEmitter.emit(
            EventTasks.UserPasswordResetRequested,
            new EventTask(EventTasks.UserPasswordResetRequested, TenantDataSource.Sandbox, { user }),
        );
    }

    async changePassword(publicId: string, data: ChangePasswordDto) {
        const user = await this.usersService.safeFindOneById(publicId);

        // Authenticate old password
        await this.usersService.authenticateCredentials(user, data.oldPassword);

        if (!this.twoFactorAuth.hasMFA(user)) {
            await this.usersService.changePassword(user.id, data.newPassword);
            return AppMessages.PASSWORD_RESET_SUCCESSFUL;
        }

        if (data.token) {
            const isValid = this.twoFactorAuth.verifyTOTPSecret(user, data.mfaChannel, data.token);

            if (isValid) {
                await this.usersService.changePassword(user.id, data.newPassword);
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

    async resetPasswordByToken(userId: string, data: ResetPasswordDto) {
        return this.usersService.changePassword(userId, data.newPassword);
    }

    async activateAccount(publicId: string, data: ActivateAccountDto): Promise<UserWithAccessToken> {
        const user = await this.usersService.findOneById(publicId);
        const business = await this.businessService.findOneById(data.businessId);

        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.passwordHash = await SCryptCryptoFactory.hash(data.password);
        user.emailConfirmed = true;
        user.status = AccountStatus.ACTIVE;
        user.business = business;

        // save user
        await this.usersService.save(user);

        this.eventEmitter.emit(
            EventTasks.UserAccountActivated,
            new EventTask(EventTasks.UserAccountActivated, TenantDataSource.Sandbox, { user, business }),
        );

        return this.authenticatedUser(user);
    }

    async getAccountInfo(publicId: string): Promise<HydratedDocument<User>> {
        return this.usersService.findOneAndPopulate({ _id: publicId }, 'business');
    }

    private authenticatedUser(user: HydratedDocument<User>): UserWithAccessToken {
        // Create  token
        const payload = {
            org: user.business,
            sub: user.id,
            email: user.email,
            roles: user.roles,
        };

        // lets create the token
        const accessToken = this.jwt.sign(payload);

        return { accessToken, user };
    }
}
