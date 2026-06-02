import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
    CurrentUser,
    Permission,
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
} from '@common/decorators';
import { Permissions } from '@api/roles';
import { APIPagingDto } from '@common/api-paging';
import { ParamMongoIdDto } from '@common/dtos';
import { JWTUser } from '@auth/jwt.strategy';
import { TeamService } from './team.service';
import { TeamInviteUserDto } from './team.dto';
import { ApiHydratedUser } from '@api/users/user.schema';
import { Types } from 'mongoose';

@ApiTags('team')
@Controller('team')
export class TeamController {
    constructor(private service: TeamService) {}

    @ApiOperation({ summary: 'Get Team Members' })
    @ApiBearerAuth()
    @Permission(Permissions.TeamReadMembers)
    @Get('/members')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedUser, 200, 'Team members retrieved successfully')
    @ApiCommonResponse()
    public async getMembers(@CurrentUser('businessId') businessId: Types.ObjectId, @Query() query: APIPagingDto) {
        return this.service.getMembers(businessId, query);
    }

    @ApiOperation({ summary: 'Invite Team Member' })
    @ApiBearerAuth()
    @Permission(Permissions.TeamCreateInvite)
    @Post('/invite')
    @HttpCode(HttpStatus.CREATED)
    @ApiBasicResponse(201, 'User invited successfully')
    @ApiCommonResponse()
    public async invite(@CurrentUser() admin: JWTUser, @Body() body: TeamInviteUserDto) {
        await this.service.inviteUser(admin.businessId, body, admin.userId);

        return 'Successfully Invited user';
    }

    @ApiOperation({ summary: 'Revoke Team Member Invite' })
    @ApiBearerAuth()
    @Permission(Permissions.TeamDeleteInvite)
    @ApiParam({ name: 'id', description: 'Invite ID', type: String })
    @Delete('/invite/:id')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Invite revoked successfully')
    @ApiBasicResponse(404, 'Invite not found')
    @ApiCommonResponse()
    public async revokeInvite(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto) {
        await this.service.revokeInvite(user.businessId, param.id);

        return 'Successfully Revoked Invite';
    }

    @ApiOperation({ summary: 'Deactivate Team Member' })
    @ApiBearerAuth()
    @Permission(Permissions.TeamUpdateMember)
    @ApiParam({ name: 'id', description: 'User ID', type: String })
    @Patch('/:id/deactivate')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'User deactivated successfully')
    @ApiBasicResponse(404, 'User not found')
    @ApiCommonResponse()
    public async deactivate(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto) {
        await this.service.deactivateMember(user.businessId, param.id);

        return 'Successfully deactivated user';
    }
}
