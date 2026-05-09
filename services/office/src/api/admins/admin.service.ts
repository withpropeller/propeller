import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Utils, MONGO_UNIQUE_CONSTRAINT_CODE, AccountStatus, TenantDataSource } from '@core/helpers';
import { CryptoUtils, SCryptCryptoFactory } from '@core/crypto';
import { RolesService } from '@api/roles';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Repository } from '@core/abstracts/repository';
import { MongoAPIPaging } from '@common/api-paging';
import { EmailConflictException } from '@common/exceptions';
import { AuthException } from '@auth/auth.exception';
import { SESSION_TOKEN_EXPIRY_SECONDS } from '@auth/auth.constants';
import { differenceInSeconds } from 'date-fns';
import { RegisterServiceIntegrationDto } from '@api/profile/profile.dto';
import { ServiceIntegrationType } from '../users/users.enums';
import { Admin } from './admin.schema';

@Injectable()
export class AdminService extends Repository<Admin> {
    constructor(
        @InjectModel(Admin.name, TenantDataSource.Office)
        model: Model<HydratedDocument<Admin>>,
        private rolesService: RolesService,
    ) {
        super(model);
    }

    async create(details: Partial<Admin>): Promise<HydratedDocument<Admin>> {
        try {
            const entity = this.createPartial(details);

            return await this.save(entity);
        } catch (err) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw new EmailConflictException();
            }
            throw err;
        }
    }

    async findOneByEmail(email: string, failSilently = false) {
        const user = await this.model.findOne({ email }).exec();
        if (!user && !failSilently) {
            throw new NotFoundException(`Account not found`);
        }
        return user;
    }

    async update(criteria: Record<string, unknown>, update: Partial<Admin>) {
        return await this.model.updateOne(criteria, update);
    }

    /**
     *
     * @param user
     * @param password
     * TODO: Add User  publiId  to revoked tokens
     */
    async changePassword(userId: Types.ObjectId, password: string) {
        const passwordHash = await SCryptCryptoFactory.hash(password);

        return this.updateById(userId, { $set: { passwordHash } });
    }

    /**
     * Get Unique Security token
     */
    async getSecurityToken() {
        const token = Utils.generateRandomNumber(6).toFixed();

        // check of token exist
        const tokenExist = await this.findOne({
            securityToken: token,
        });
        if (tokenExist) {
            return this.getSecurityToken();
        }

        return token;
    }

    async authenticateCredentials(user: Admin, password: string) {
        const isPinAuthentic = await SCryptCryptoFactory.compare(password, user.passwordHash);

        if (user.status !== AccountStatus.ACTIVE) {
            throw AuthException.ACCOUNT_INACTIVE(user.status);
        }

        if (!isPinAuthentic) {
            throw AuthException.INVALID_PASSWORD;
        }

        return user;
    }

    async addUserRoles(userId: Types.ObjectId, newRoles: string[]) {
        const roles = await this.rolesService.fetchRolesFromCache();

        if (!roles) {
            throw new Error('Empty role list');
        }

        const rolesValid = () => newRoles.every((i) => roles.find((v) => v.publicId === i));

        if (rolesValid()) {
            return this.assignRoles(userId, newRoles);
        } else {
            throw new BadRequestException('Invalid role list');
        }
    }

    /**
     * Assign User Roles
     * @param userId
     * @param roles
     */
    async assignRoles(userId: Types.ObjectId, roles: string[]): Promise<Admin> {
        const user = await this.findById(userId);
        const userRoles = user.roles || [];

        const updatedRoles = userRoles.concat(roles as any);
        user.roles = [...new Set(updatedRoles)];

        return this.save(user);
    }

    /**
     * Unassign User Roles
     * @param userId
     * @param roles
     */
    async unAssignRoles(userId: Types.ObjectId, roles: string[]): Promise<Admin> {
        const user = await this.findById(userId);
        user.roles = user.roles.filter((v) => !roles.includes(v._id.toString()));

        return this.save(user);
    }

    async orgMemberCount(organizationId: string) {
        const organization = new Types.ObjectId(organizationId);

        const { conditions } = MongoAPIPaging.getPagingConstraints({}, { organization });

        return await this.model.find(conditions).count().exec();
    }

    async setStateToken(userId: Types.ObjectId, isMobileFriendly = false): Promise<string> {
        const code = isMobileFriendly ? Utils.generateRandomNumber(6).toString() : Utils.generateRandomID(16);

        const stateToken = {
            requestedAt: new Date(),
            ttl: SESSION_TOKEN_EXPIRY_SECONDS,
            code,
        };

        await this.updateById(userId, { stateToken });

        const strToReturn = `${userId}:${code}`;
        return CryptoUtils.base64EncodeUrlSafe(strToReturn);
    }

    decodeStateToken(token: string): { userId: string; code: string } {
        const decodedToken = CryptoUtils.base64DecodeUrlSafe(token);
        const [userId, code] = decodedToken.split(':');

        if (!Types.ObjectId.isValid(userId) || !code) {
            throw AuthException.INVALID_TOKEN;
        }

        return { userId, code };
    }

    async validateStateToken(userId: string, code: string) {
        const user = await this.findOne({ _id: userId, 'stateToken.code': code }, true);

        if (user && user.stateToken) {
            const currentDate = new Date();

            if (differenceInSeconds(currentDate, user.stateToken.requestedAt) > user.stateToken.ttl) {
                throw AuthException.TOKEN_EXPIRED;
            }

            await this.updateById(user.id, { $set: { stateToken: null } });
            return user;
        }

        throw AuthException.INVALID_TOKEN;
    }

    async registerServiceIntegration(publicId: Types.ObjectId, body: RegisterServiceIntegrationDto) {
        const user = await this.safeFindOneById(publicId);
        const integration = user.toObject().integration;

        if (body.service === ServiceIntegrationType.OneSignal) {
            await this.updateById(user.id, {
                $set: { integration: { ...integration, onesignal: body.data } },
            });

            return;
        }

        throw new BadRequestException('Invalid service integration type');
    }
}
