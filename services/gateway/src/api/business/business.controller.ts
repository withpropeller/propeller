import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { InviteUserDto } from './business.dto';
import { APIPagingDto } from '@common/api-paging';
import { BusinessService } from './business.service';
import { ParamMongoIdDto } from '@common/dtos';
import { JWTUser } from '@auth/jwt.strategy';

@ApiTags('business')
@Controller('business')
export class BusinessController {
    constructor(private service: BusinessService) {}

    @ApiOperation({ summary: 'Get  Business' })
    @Get('/')
    @Permission(Permissions.BusinessRead)
    public async find(@CurrentUser('businessId') businessId: string, @Query() query: APIPagingDto) {
        return this.service.findOneAndPopulate({ _id: businessId }, query.expand);
    }

    @ApiOperation({ summary: 'Get  Business' })
    @Get('/info')
    @Permission(Permissions.BusinessReadInfo)
    public async getInfo(@CurrentUser('businessId') businessId: string) {
        return this.service.findOne({ _id: businessId }, false, 'name email status');
    }

    @ApiOperation({ summary: 'Invite User' })
    @Permission(Permissions.BusinessCreateInvite)
    @Post('/invite')
    public async create(@CurrentUser() admin: JWTUser, @Body() body: InviteUserDto) {
        await this.service.inviteUser(admin.businessId, body, admin.userId);

        return 'Successfully Invited user';
    }

    @ApiOperation({ summary: 'Revoke User Invite' })
    @Permission(Permissions.BusinessDeleteInvite)
    @Delete('/invite/:id')
    public async revokeInvite(@CurrentUser('businessId') businessId: string, @Param() param: ParamMongoIdDto) {
        await this.service.revokeInvite(businessId, param.id);

        return 'Successfully Revoked Invite';
    }

    @ApiOperation({ summary: 'Get Business Members' })
    @Permission(Permissions.BusinessReadMembers)
    @Get('/members')
    public async getBusiness(@CurrentUser('businessId') businessId: string, @Query() query: APIPagingDto) {
        return this.service.getBusinessMembers(businessId, query);
    }
}
