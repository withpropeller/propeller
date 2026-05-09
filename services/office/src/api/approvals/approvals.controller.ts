import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    CurrentUser,
    Permission,
} from '@common/decorators';
import { Permissions } from '@api/roles';
import { PermissionsGuard } from '@auth/guards/permission.guard';
import { ApprovalService } from '@api/approvals/approvals.service';
import { JWTUser } from '@auth/jwt.strategy';
import { APIPagingDto } from '@common/api-paging';
import { ParamTagIdDto } from '@common/dtos';
import { Request } from 'express';
import { ApiHydratedApproval } from './approvals.schema';

@ApiTags('approvals')
@ApiBearerAuth()
@Controller('approvals')
@UseGuards(PermissionsGuard)
export class ApprovalController {
    constructor(private service: ApprovalService) {}

    @ApiOperation({ summary: 'Get All Approvals' })
    @Permission(Permissions.ApprovalsRead)
    @Get('')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedApproval, 200, 'Approvals retrieved successfully')
    @ApiCommonResponse()
    public async getAllApprovals(@Query() query: APIPagingDto) {
        return this.service.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get One Approval' })
    @ApiParam({ name: 'id', description: 'Approval ID', type: String })
    @Permission(Permissions.ApprovalsRead)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedApproval, 200, 'Approval retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Approval not found')
    public async findOne(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return await this.service.findOneAndPopulate({ _id: param.id }, query.expand);
    }

    @ApiOperation({ summary: 'Accept an Approval' })
    @ApiParam({ name: 'id', description: 'Approval ID', type: String })
    @Permission(Permissions.ApprovalDecisionAccept)
    @Post('/:id/accept')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Approval successfully accepted')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Approval not found')
    public async accept(
        @Param() param: ParamTagIdDto,
        @CurrentUser() user: JWTUser,
        @Body() body: Record<string, string>,
        @Req() req: Request,
        @Query() query: APIPagingDto,
    ) {
        await this.service.accept(user.userId, param.id, body, req, query);

        return 'Approval successfully Accepted';
    }

    @ApiOperation({ summary: 'Decline an Approval' })
    @ApiParam({ name: 'id', description: 'Approval ID', type: String })
    @Permission(Permissions.ApprovalDecisionDecline)
    @Post('/:id/decline')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Approval successfully declined')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Approval not found')
    public async decline(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamTagIdDto,
        @Req() req: Request,
        @Query() query: APIPagingDto,
    ) {
        await this.service.decline(user.userId, param.id, req, query);

        return 'Approval successfully Declined';
    }

    @ApiOperation({ summary: 'Reverse Approval Decision to Pending' })
    @ApiParam({ name: 'id', description: 'Approval ID', type: String })
    @Permission(Permissions.ApprovalDecisionReverse)
    @Post('/:id/reverse')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Approval status set to pending')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Approval not found')
    public async reverseDecision(@CurrentUser() user: JWTUser, @Param() param: ParamTagIdDto) {
        await this.service.reverse(user.userId, param.id);

        return 'Approval status is now pending';
    }
}
