import { Global, Module, OnModuleInit } from '@nestjs/common';
import { Role, RoleSchema } from './roles.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesService } from './roles.service';
import { TenantDataSource } from '@core/helpers/enums';

@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }], TenantDataSource.Core)],
    providers: [RolesService],
    exports: [RolesService],
})
export class RolesModule implements OnModuleInit {
    constructor(private roleService: RolesService) {}

    async onModuleInit() {
        await this.roleService.cacheRoles();
    }
}
