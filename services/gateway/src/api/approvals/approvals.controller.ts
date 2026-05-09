import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { ApprovalService } from '@api/approvals/approvals.service';
import { JWTUser } from '@auth/jwt.strategy';

@ApiTags('approvals')
@Controller('approvals')
export class ApprovalController {
    constructor(private service: ApprovalService) {}

    @ApiOperation({ summary: 'Request Business Account Approval' })
    @Permission(Permissions.ApprovalsBusinessAccount)
    @Post('/business-account')
    public async requestBusinessAccountApproval(@CurrentUser() user: JWTUser) {
        await this.service.requestBusinessAccountApproval(user.userId, user.businessId);
        return 'Business Account Approval Request successful';
    }
}
