import { Injectable, NotFoundException, Inject, CACHE_MANAGER, CacheStore, Logger } from '@nestjs/common';
import { Role } from './roles.schema';
import { ROLES_CACHE_KEY } from '@common/helpers';
import { AddRolePermissionDto, CreateRolesDto } from './dto/roles.dto';
import { TenantDataSource, Utils } from '@core/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Repository } from '@core/abstracts/repository';

@Injectable()
export class RolesService extends Repository<Role> {
    constructor(
        @InjectModel(Role.name, TenantDataSource.Office)
        model: Model<HydratedDocument<Role>>,
        @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
    ) {
        super(model);
    }

    async cacheRoles(): Promise<HydratedDocument<Role>[]> {
        const response = await this.find({});

        const cachedRoles = response;
        await this.cacheManager.set(ROLES_CACHE_KEY, cachedRoles, {
            ttl: 0,
        });

        Logger.log('Added Roles to Cache Store', 'RoleService');
        return cachedRoles;
    }

    async create(data: CreateRolesDto) {
        await this.createAndSave({
            name: data.name,
            slug: Utils.toSlug(data.name),
            permissions: data.permissions,
        });

        return this.cacheRoles();
    }

    async findOneBySlug(slug: string, failSilently = false) /*: Promise<Role> */ {
        const role = await this.model.findOne({ slug }).exec();
        if (!role && !failSilently) {
            throw new NotFoundException(`Role Does not exist`);
        }
        return role;
    }

    async fetchRolesFromCache(): Promise<HydratedDocument<Role>[]> {
        const cachedRoles = await this.cacheManager.get<HydratedDocument<Role>[]>(ROLES_CACHE_KEY);

        if (!cachedRoles) {
            return this.cacheRoles();
        }
        return cachedRoles;
    }

    async findOneByIdFromCache(id: number, failSilently = false) /*: Promise<Role>*/ {
        const roles = await this.fetchRolesFromCache();
        const role = roles.find((v) => v.id === id);

        if (!role && !failSilently) {
            throw new NotFoundException(`Role Does not exist`);
        }
        return role;
    }

    async findByRoleSlugFromCache(slug: string, failSilently = false): Promise<HydratedDocument<Role>> {
        const roles = await this.fetchRolesFromCache();
        const role = roles.find((v) => v.slug === slug);

        if (!role && !failSilently) {
            throw new NotFoundException(`Role Does not exist`);
        }
        return role;
    }

    async fetchRolesBySlugsFromCache(slugs: string[]): Promise<HydratedDocument<Role>[]> {
        const roles = await this.fetchRolesFromCache();
        return roles.filter((v) => slugs.includes(v.slug));
    }

    async addPermissions(publicId: Types.ObjectId, body: AddRolePermissionDto) {
        const role = await this.findById(publicId);
        const updatedPermissions = role.permissions.concat(body.permissions);

        // Enforce uniqueness
        role.permissions = Array.from(new Set(updatedPermissions));

        await role.save();
        return this.cacheRoles();
    }

    async removePermissions(publicId: Types.ObjectId, body: AddRolePermissionDto) {
        const role = await this.findById(publicId);
        role.permissions = role.permissions.filter((v) => !body.permissions.includes(v));

        await role.save();
        return this.cacheRoles();
    }
}
