import { Module, OnModuleInit } from '@nestjs/common';
import { UsersModule } from '@api/users';
import { Role, RoleSchema } from './roles.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesService } from './roles.service';
import { TenantDataSource } from '@core/helpers/enums';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }], TenantDataSource.Core),
        UsersModule
    ],
    providers: [RolesService],
    exports: [RolesService],
})
export class RolesModule implements OnModuleInit {
    constructor(private roleService: RolesService) {}

    async onModuleInit() {
        await this.roleService.cacheRoles();
    }
}
