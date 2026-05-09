import {
    Body,
    Controller,
    Get,
    Post,
    Put,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators';
import { DashboardMode, User, UsersService } from '@api/users';
import { PatchProfileDto } from './dto';
import { AppMessages, AppStatus, Utils } from '@core/helpers';
import { Activated2FADto as Activate2FADto, SendMFADto, SetDefaultMFADto, Setup2FADto } from '@api/profile/dto/two-fa.dto';
import { MultiFactorAuth } from '@auth/multi-factor.auth';
import { MongooseSerializerInterceptor } from '@core/interceptors';
import { APIPagingDto } from '@common/api-paging';
import { JWTUser } from '@auth/jwt.strategy';
import { RegisterServiceIntegrationDto } from './profile.dto';
import { BusinessStatus } from '@api/business/business.enums';
import { BusinessException } from '@api/business/business.exception';

@ApiBearerAuth()
@ApiTags('me')
@Controller('me')
export class ProfileController {
    constructor(
        private readonly userService: UsersService,
        private readonly twoFactorAuth: MultiFactorAuth,
    ) { }

    @Get()
    @UseInterceptors(MongooseSerializerInterceptor(User))
    @ApiOperation({ summary: 'Get profile details' })
    get(@CurrentUser('userId') publicId: string, @Query() query: APIPagingDto) {
        return this.userService.findOneAndPopulate({ _id: publicId }, query.expand);
    }

    // TODO
    @ApiOperation({ summary: 'Profile Update Route' })
    @Put('/')
    public async updateProfile(@CurrentUser('userId') userId: string, @Body() body: PatchProfileDto) {
        const profileUpdates = Utils.removeNilValues({
            firstName: body.firstName,
            lastName: body.lastName,
            preferences: body.preferences,
        });

        if (profileUpdates.preferences?.dashboardMode === DashboardMode.Live) {
            const user = await this.userService.findOneAndPopulate({ _id: userId }, "business");
            if (user.business.status !== BusinessStatus.APPROVED) {
                throw BusinessException.BusinessNotApproved;
            }
            await this.userService.updateById(userId, profileUpdates);
        }

        await this.userService.updateById(userId, profileUpdates);
    }

    /**
     * Get MFA profile
     *
     */
    @ApiOperation({ summary: 'Get MFA profile' })
    @Get('mfa')
    public async getMFA(@CurrentUser('userId') publicId: string) {
        const user = await this.userService.findOneById(publicId);

        const userJson = user.toObject();

        return Utils.pickKeys(userJson.multiFactors, '-recoveryKeyHash -secret');
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Set up 2FA' })
    @Post('mfa/setup')
    public async setup2FA(@CurrentUser('userId') publicId: string, @Body() data: Setup2FADto) {
        const response = await this.twoFactorAuth.setup2FA(publicId, data, true);

        return {
            code: AppStatus.Success,
            data: response,
            message: AppMessages.TWO_FACTOR_ACTIVATION_NEEDED,
        };
    }

    @ApiOperation({ summary: 'Deactivate 2FA' })
    @Post('mfa/deactivate')
    public async deactivate2FA(@CurrentUser('userId') publicId: string, @Body() data: Setup2FADto) {
        await this.twoFactorAuth.deactivate2FA(publicId, data, true);

        return AppMessages.TWO_FA_DEACTIVATED_SUCCESSFUL;
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Confirm User Email' })
    @Post('mfa/set-default')
    public async update2FA(@CurrentUser('userId') publicId: string, @Body() data: SetDefaultMFADto) {
        await this.twoFactorAuth.setDefault(publicId, data.channel);

        return AppMessages.TWO_FACTOR_DEFAULT_SET;
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Confirm User Email' })
    @Post('mfa/activate')
    public async activate2FA(@CurrentUser('userId') publicId: string, @Body() data: Activate2FADto) {
        const response = await this.twoFactorAuth.activate2FA(publicId, data);

        return {
            code: AppStatus.Success,
            data: response,
            message: AppMessages.TWO_FA_ACTIVATED_SUCCESSFUL,
        };
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Confirm User Email' })
    @Post('mfa/send')
    public async send2FA(@CurrentUser('userId') publicId: string, @Body() body: SendMFADto) {
        return this.twoFactorAuth.sendUserMFA(publicId, body.channel);
    }

    @ApiOperation({ summary: 'Register Service Integration' })
    @Post('service-integrations/register')
    registerServiceIntegration(@CurrentUser() user: JWTUser, @Body() body: RegisterServiceIntegrationDto) {
        return this.userService.registerServiceIntegration(user.userId, body);
    }
}
