import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Utils, MONGO_UNIQUE_CONSTRAINT_CODE, AccountStatus, TenantDataSource } from '@core/helpers';
import { CryptoUtils, SCryptCryptoFactory } from '@core/crypto';
import { RoleSlugs, RolesService } from '@api/roles';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { User } from './user.schema';
import { Repository } from '@core/abstracts/repository';
import { MongoAPIPaging } from '@common/api-paging';
import { EmailConflictException } from '@common/exceptions';
import { AuthException } from '@auth/auth.exception';
import { SESSION_TOKEN_EXPIRY_SECONDS } from '@auth/auth.constants';
import { isMongoId } from 'class-validator';
import { differenceInSeconds } from 'date-fns';
import { RegisterServiceIntegrationDto } from '@api/profile/profile.dto';
import { ServiceIntegrationType } from './users.enums';
import { InviteExternalUserDto } from '@api/business/business.dto';
import { AppException } from '@core/exceptions';
import { PhoneConflictException } from '@common/exceptions/phone-conflict.exception';

@Injectable()
export class UsersService extends Repository<User> {
    constructor(
        @InjectModel(User.name, TenantDataSource.Core) model: Model<HydratedDocument<User>>,
        private rolesService: RolesService) {
        super(model);
    }

    async create(details: Partial<User>): Promise<HydratedDocument<User>> {
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

    async createBatchExternalAccounts(businessId: string, users: InviteExternalUserDto[]) {
        const role = await this.rolesService.findByRoleSlugFromCache(RoleSlugs.External);
        const cardEntities = users.map((v) =>
            Utils.removeNilValuesDeep({
                ...v,
                roles: [role._id],
                status: AccountStatus.ACTIVE,
                business: businessId,
            }),
        );

        const session = await this.model.startSession();

        try {
            session.startTransaction();

            await this.bulkInsert(cardEntities), { session };
            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                if (err.message.includes('email')) {
                    throw new EmailConflictException();
                }
                throw new PhoneConflictException();
            }
            throw new AppException(err);
        } finally {
            session.endSession();
        }
    }

    async findOneByEmail(email: string, failSilently = false) {
        const user = await this.model.findOne({ email }).exec();
        if (!user && !failSilently) {
            throw new NotFoundException(`Account not found`);
        }
        return user;
    }

    async update(criteria: Record<string, unknown>, update: Partial<User>) {
        return await this.model.updateOne(criteria, update);
    }

    /**
     *
     * @param user
     * @param password
     * TODO: Add User  publiId  to revoked tokens
     */
    async changePassword(userId: string, password: string) {
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

    async authenticateCredentials(user: User, password: string) {
        const isPinAuthentic = await SCryptCryptoFactory.compare(password, user.passwordHash);

        if (user.status !== AccountStatus.ACTIVE) {
            throw AuthException.ACCOUNT_INACTIVE(user.status);
        }

        if (!isPinAuthentic) {
            throw AuthException.INVALID_PASSWORD;
        }

        return user;
    }

    async addUserRoles(userId: string, newRoles: string[]) {
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
    async assignRoles(userId: string, roles: string[]): Promise<User> {
        const user = await this.findOneById(userId);
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
    async unAssignRoles(userId: string, roles: string[]): Promise<User> {
        const user = await this.findOneById(userId);
        user.roles = user.roles.filter((v) => !roles.includes(v._id.toString()));

        return this.save(user);
    }

    async orgMemberCount(organizationId: string) {
        const organization = new Types.ObjectId(organizationId);

        const { conditions } = MongoAPIPaging.getPagingConstraints({}, { organization });

        return await this.model.find(conditions).count().exec();
    }

    async setStateToken(userId: string, isMobileFriendly = false): Promise<string> {
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

        if (!isMongoId(userId) || !code) {
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

    async registerServiceIntegration(publicId: string, body: RegisterServiceIntegrationDto) {
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

    async createBareAccount(email: string, businessId: string, roleSlugs: string[]): Promise<HydratedDocument<User>> {
        const roles = await this.rolesService.fetchRolesBySlugsFromCache(roleSlugs);

        const roleIds = roles.map((v) => v._id);

        if (roleIds.length === 0) {
            throw new BadRequestException('User must have a valid role');
        }

        const entity = this.createPartial({ email, status: AccountStatus.REQUIRES_ACTIVATION });
        entity.business = businessId as any;
        entity.roles = roleIds as any;

        return await this.createAndSave(entity);
    }
}
