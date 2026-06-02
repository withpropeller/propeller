import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
    ApiResponseWrapper,
    CurrentUser,
    Permission,
} from '@common/decorators';
import { Permissions } from '@api/roles';
import { InviteUserDto } from './business.dto';
import { APIPagingDto } from '@common/api-paging';
import { BusinessService } from './business.service';
import { ParamMongoIdDto } from '@common/dtos';
import { JWTUser } from '@auth/jwt.strategy';
import { ApiHydratedBusiness } from './business.schema';

@ApiBearerAuth()
@ApiTags('business')
@Controller('business')
export class BusinessController {
    constructor(private service: BusinessService) {}

    @ApiOperation({ summary: 'Get Business' })
    @Get('/')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.BusinessRead)
    @ApiResponseWrapper(ApiHydratedBusiness, 200, 'Business retrieved successfully')
    @ApiCommonResponse()
    public async find(@CurrentUser('businessId') businessId: string, @Query() query: APIPagingDto) {
        return this.service.findOneAndPopulate({ _id: businessId }, query.expand);
    }

    @ApiOperation({ summary: 'Get Business Info' })
    @Get('/info')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.BusinessReadInfo)
    @ApiResponseWrapper(ApiHydratedBusiness, 200, 'Business info retrieved successfully')
    @ApiCommonResponse()
    public async getInfo(@CurrentUser('businessId') businessId: string) {
        return this.service.findOne({ _id: businessId }, false, 'name email status');
    }

    @ApiOperation({ summary: 'Invite User' })
    @Permission(Permissions.BusinessCreateInvite)
    @Post('/invite')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'User invited successfully')
    @ApiCommonResponse()
    public async create(@CurrentUser() admin: JWTUser, @Body() body: InviteUserDto) {
        await this.service.inviteUser(admin.businessId, body, admin.userId);

        return 'Successfully Invited user';
    }

    @ApiOperation({ summary: 'Revoke User Invite' })
    @Permission(Permissions.BusinessDeleteInvite)
    @ApiParam({ name: 'id', description: 'Invite ID', type: String })
    @Delete('/invite/:id')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Invite revoked successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Invite not found')
    public async revokeInvite(@CurrentUser() admin: JWTUser, @Param() param: ParamMongoIdDto) {
        await this.service.revokeInvite(admin.businessId, param.id);

        return 'Successfully Revoked Invite';
    }

    @ApiOperation({ summary: 'Get Business Members' })
    @Permission(Permissions.BusinessReadMembers)
    @Get('/members')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedBusiness, 200, 'Business members retrieved successfully')
    @ApiCommonResponse()
    public async getBusiness(@CurrentUser() admin: JWTUser, @Query() query: APIPagingDto) {
        return this.service.getBusinessMembers(admin.businessId, query);
    }
}
