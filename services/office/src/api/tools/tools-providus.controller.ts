import { PermissionsGuard } from '@auth/guards/permission.guard';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles/roles.enums';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProvidusSettlementRepushDto } from './tools.dto';
import { ToolsService } from './tools.services';
import { JWTUser } from '@auth/jwt.strategy';
import { Request } from 'express';

@ApiTags('tools/providus')
@Controller('tools/providus')
@UseGuards(PermissionsGuard)
export class ToolsProvidusController {
    constructor(private service: ToolsService) {}

    @ApiOperation({ summary: 'Repush Settlement' })
    @Post('/repush-settlement')
    @Permission(Permissions.ToolsProvidusRepushSettlement)
    public async repushSettlement(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Body() body: ProvidusSettlementRepushDto,
    ) {
        if (body.force) {
            return this.service.repushSettlementForce(user.userId, body, req);
        }
        return this.service.repushSettlement(user.userId, body, req);
    }
}
