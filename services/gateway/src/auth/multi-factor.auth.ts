import { Activated2FADto, RecoverMFADto, Setup2FADto } from '@api/profile/dto/two-fa.dto';
import { MultiFactorSettings, User, UsersService } from '@api/users';
import { AccessKeyTag, MessagingChannel, NotificationTemplates, Utils } from '@core/helpers';
import { NotificationHandler } from '@common/notifications/notification-handler.service';
import { Injectable } from '@nestjs/common';
import { authenticator, totp } from 'otplib';
import { TwoFAChannels } from './auth.enums';
import { AuthException } from './auth.exception';
import { AccessKeyUtils } from '@core/crypto';
import { ExtractEmailNotificationTo } from '@core/jobs/notification.job';
import { HydratedDocument, Types } from 'mongoose';

@Injectable()
export class MultiFactorAuth {
    constructor(private usersService: UsersService, private notificationHandler: NotificationHandler) {}

    async getMFASettings(publicId: Types.ObjectId) {
        const user = await this.usersService.findOneAndUpdate({ _id: publicId }, { $set: { stateToken: null } });

        const multiFactors = user.toObject().multiFactors;

        return Utils.pickKeys(multiFactors, '-secret -recoveryKeyHash');
    }

    hasMFA(user: User) {
        const multiFactors = user.multiFactors || [];
        return !!multiFactors.find((v) => v.enabled);
    }

    async activate2FA(publicId: Types.ObjectId, data: Activated2FADto) {
        const user = await this.usersService.findById(publicId);

        const multiFactors = user.multiFactors || [];
        const factor = multiFactors.find((v) => v.channel === data.channel);

        if (!factor) {
            throw AuthException.MFA_SETUP_NOT_FOUND;
        }

        const verified = this.verifyTOTPSecret(user, factor.channel, data.token, false);
        if (!verified) {
            throw AuthException.INVALID_TOKEN;
        }

        const [plainKey, hashedKey] = await AccessKeyUtils.generateAccessKey(AccessKeyTag.RecoveryKey);

        await this.addMFA(user, {
            channel: factor.channel,
            secret: factor.secret,
            recoveryKeyHash: hashedKey,
            default: factor.default,
            enabled: true,
        });

        return { recoveryKey: plainKey };
    }

    async setup2FA(publicId: Types.ObjectId, data: Setup2FADto, sendToken = false) {
        const user = await this.usersService.findById(publicId);

        // authenticate password
        await this.usersService.authenticateCredentials(user, data.password);

        let options;

        switch (data.channel) {
            case TwoFAChannels.Phone:
                options = { phone: data.phoneNumber, messagingChannel: data.messagingChannel || MessagingChannel.SMS };
                break;
            case TwoFAChannels.Email:
                options = { email: user.email };
                break;
        }

        const secret = this.generateTOTPSecret();
        const mfa = { channel: data.channel, default: data.default || false, secret, options };

        // add new MFA
        await this.addMFA(user, mfa);

        if (data.channel === TwoFAChannels.Authenticator) {
            const otpAuth = authenticator.keyuri(user.email, 'Hyphen', secret);
            return { otpAuth, setupKey: secret };
        }

        if (sendToken) {
            this.send2FAToken(user, mfa);
        }
    }

    async deactivate2FA(publicId: Types.ObjectId, data: Setup2FADto, sendToken = false) {
        const user = await this.usersService.findById(publicId);

        // authenticate password
        await this.usersService.authenticateCredentials(user, data.password);

        // Get The factor
        let multiFactors = user.multiFactors || [];
        const factor = multiFactors.find((v) => v.channel === data.channel);

        if (!factor) {
            throw AuthException.MFA_SETUP_NOT_FOUND;
        }

        multiFactors = multiFactors.filter((v) => v.channel !== factor.channel);

        return this.usersService.updateById(user.id, { $set: { multiFactors } });
    }

    async recoverMFA(publicId: Types.ObjectId, data: RecoverMFADto) {
        const user = await this.usersService.findById(publicId);

        // Get The factor
        const multiFactors = user.multiFactors || [];
        const factor = multiFactors.find((v) => v.channel === data.channel);

        if (!factor) {
            throw AuthException.MFA_SETUP_NOT_FOUND;
        }

        // authenticate recovery key
        const isValidAccessKey = await AccessKeyUtils.validateAccessKey(data.recoveryKey, factor.recoveryKeyHash);
        if (!isValidAccessKey) {
            throw AuthException.INVALID_MFA_RECOVERY_KEY;
        }

        if (data.channel === TwoFAChannels.Authenticator) {
            const otpAuth = authenticator.keyuri(user.email, 'Allawee', factor.secret);
            return { otpAuth, setupKey: factor.secret };
        }

        let options;

        switch (data.channel) {
            case TwoFAChannels.Phone:
                options = { phone: data.phoneNumber, messagingChannel: data.messagingChannel || MessagingChannel.SMS };
                break;
            case TwoFAChannels.Email:
                options = { email: user.email };
                break;
        }

        // update new MFA
        const mfa = { ...factor, ...options };
        await this.addMFA(user, mfa);
        this.send2FAToken(user, mfa);
    }

    async sendUserMFA(publicId: Types.ObjectId, channel: TwoFAChannels) {
        const user = await this.usersService.findById(publicId);

        const multiFactors = user.multiFactors || [];
        const factor = multiFactors.find((v) => v.channel === channel);

        if (!factor) {
            throw AuthException.MFA_SETUP_NOT_FOUND;
        }

        return this.send2FAToken(user, factor);
    }

    addMFA(user: HydratedDocument<User>, mfa: MultiFactorSettings) {
        let multiFactors = user.toObject().multiFactors || [];
        const factor = multiFactors.find((v) => v.channel === mfa.channel);

        // Make thiis MFA the default if empty
        if (multiFactors.length === 0) {
            mfa = { ...mfa, default: true };
        }

        // Reset the default
        if (mfa.default && multiFactors.length > 0) {
            multiFactors = multiFactors.map((v) => (v.default ? { ...v, default: false } : v));
        }

        if (!factor) {
            multiFactors.push(mfa);
        } else {
            multiFactors = multiFactors.map((v) => (v.channel === mfa.channel ? mfa : v));
        }

        return this.usersService.updateById(user.id, { $set: { multiFactors } });
    }

    async setDefault(publicId: Types.ObjectId, channel: TwoFAChannels) {
        const user = await this.usersService.findById(publicId);

        let multiFactors = user.multiFactors || [];
        const factor = multiFactors.find((v) => v.channel === channel);

        if (!factor) {
            throw AuthException.MFA_SETUP_NOT_FOUND;
        }

        multiFactors = multiFactors.map((v) => {
            if (v.channel === channel) {
                v.default = true;
                return v;
            }

            v.default = false;
            return v;
        });

        return this.usersService.updateById(user.id, { $set: { multiFactors } });
    }

    generateTOTPSecret() {
        return authenticator.generateSecret();
    }

    generateTOTP(mfa: MultiFactorSettings) {
        if (mfa.channel === TwoFAChannels.Authenticator) {
            return authenticator.generate(mfa.secret);
        }

        /* if (mfa.channel === TwoFAChannels.Phone) {
            totp.options = { step: 60 * 5 };
        } else  {
             totp.options = { step: 60 * 2.5, window: 1 };
        } */

        totp.options = { step: 60 * 2.5, window: 1 };
        return totp.generate(mfa.secret);
    }

    verifyTOTPSecret(user: User, channel: TwoFAChannels, token: string, checkEnabled = true) {
        const multiFactors = user.multiFactors || [];
        const factor = multiFactors.find((v) => v.channel === channel);

        if (checkEnabled && !factor.enabled) {
            throw AuthException.MFA_NOT_ENABLED();
        }

        return this.verifyMFAToken(factor, token);
    }

    verifyMFAToken(mfa: MultiFactorSettings, token: string) {
        try {
            if (mfa.channel === TwoFAChannels.Authenticator) {
                return authenticator.verify({ token, secret: mfa.secret });
            } else {
                /*else if(mfa.channel === TwoFAChannels.Phone) {
                totp.options = { step: 60 * 5 };
                return totp.verify({ token, secret: mfa.secret });
            }  */
                totp.options = { step: 60 * 2.5, window: 1 };
                return totp.verify({ token, secret: mfa.secret });
            }
        } catch (err) {
            throw AuthException.INVALID_TOKEN;
        }
    }

    send2FAToken(user: User, mfa: MultiFactorSettings) {
        const token = this.generateTOTP(mfa);

        if (mfa.channel === TwoFAChannels.Email) {
            this.handle2FATokenEmail(user, token);
        }

        if (mfa.channel === TwoFAChannels.Phone) {
            this.handle2FATokenSMS(mfa.options.phone, user.firstName, token, (mfa.options as any).messagingChannel);
        }
    }

    /**
     *
     * Send Security Token SMS to Users
     * @param user
     * */
    async handle2FATokenSMS(phone: string, firstName: string, token: string, channel: MessagingChannel): Promise<void> {
        const to = { phone: { id: phone, name: firstName, channel } };
        const content = {
            firstName,
            token,
        };

        this.notificationHandler.handle(NotificationTemplates.TwoFactorRequested, to, content);
    }

    /**
     * Send Security Token SMS to Users
     * @param user
     */
    async handle2FATokenEmail(user: User, token: string): Promise<void> {
        const content = { firstName: user.firstName, token };

        this.notificationHandler.handle(
            NotificationTemplates.TwoFactorRequested,
            ExtractEmailNotificationTo(user),
            content,
        );
    }
}
