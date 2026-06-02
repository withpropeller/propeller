import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBasicResponse, ApiCommonResponse, ApiResponseWrapper, CurrentUser } from '@common/decorators';
import { DashboardMode, User, UsersService, ApiHydratedUser } from '@api/users';
import { PatchProfileDto } from './dto';
import { AppMessages, AppStatus, Utils } from '@core/helpers';
import {
    Activated2FADto as Activate2FADto,
    SendMFADto,
    SetDefaultMFADto,
    Setup2FADto,
} from '@api/profile/dto/two-fa.dto';
import { MultiFactorAuth } from '@auth/multi-factor.auth';
import { MongooseSerializerInterceptor } from '@core/interceptors';
import { APIPagingDto } from '@common/api-paging';
import { JWTUser } from '@auth/jwt.strategy';
import { RegisterServiceIntegrationDto } from './profile.dto';
import { BusinessStatus } from '@api/business/business.enums';
import { BusinessException } from '@api/business/business.exception';
import { Types } from 'mongoose';

@ApiBearerAuth()
@ApiTags('me')
@Controller('me')
export class ProfileController {
    constructor(private readonly userService: UsersService, private readonly twoFactorAuth: MultiFactorAuth) {}

    @Get()
    @UseInterceptors(MongooseSerializerInterceptor(User))
    @ApiOperation({ summary: 'Get profile details' })
    @ApiResponseWrapper(ApiHydratedUser, 200, 'Profile retrieved successfully')
    @ApiCommonResponse()
    get(@CurrentUser('userId') publicId: string, @Query() query: APIPagingDto) {
        return this.userService.findOneAndPopulate({ _id: publicId }, query.expand);
    }

    // TODO
    @ApiOperation({ summary: 'Update profile' })
    @ApiBasicResponse(200, 'Profile updated successfully')
    @ApiCommonResponse()
    @Put('/')
    @HttpCode(HttpStatus.OK)
    public async updateProfile(@CurrentUser('userId') userId: string, @Body() body: PatchProfileDto) {
        const profileUpdates = Utils.removeNilValues({
            firstName: body.firstName,
            lastName: body.lastName,
            preferences: body.preferences,
        });

        if (profileUpdates.preferences?.dashboardMode === DashboardMode.Live) {
            const user = await this.userService.findOneAndPopulate({ _id: userId }, 'business');
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
    @ApiBasicResponse(200, 'MFA profile retrieved successfully')
    @ApiCommonResponse()
    @Get('mfa')
    public async getMFA(@CurrentUser('userId') publicId: Types.ObjectId) {
        const user = await this.userService.findById(publicId);

        const userJson = user.toObject();

        return Utils.pickKeys(userJson.multiFactors, '-recoveryKeyHash -secret');
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Set up 2FA' })
    @ApiBasicResponse(200, '2FA setup initiated successfully')
    @ApiCommonResponse()
    @Post('mfa/setup')
    @HttpCode(HttpStatus.OK)
    public async setup2FA(@CurrentUser('userId') publicId: Types.ObjectId, @Body() data: Setup2FADto) {
        const response = await this.twoFactorAuth.setup2FA(publicId, data, true);

        return {
            code: AppStatus.Success,
            data: response,
            message: AppMessages.TWO_FACTOR_ACTIVATION_NEEDED,
        };
    }

    @ApiOperation({ summary: 'Deactivate 2FA' })
    @ApiBasicResponse(200, '2FA deactivated successfully')
    @ApiCommonResponse()
    @Post('mfa/deactivate')
    @HttpCode(HttpStatus.OK)
    public async deactivate2FA(@CurrentUser('userId') publicId: Types.ObjectId, @Body() data: Setup2FADto) {
        await this.twoFactorAuth.deactivate2FA(publicId, data, true);

        return AppMessages.TWO_FA_DEACTIVATED_SUCCESSFUL;
    }

    @ApiOperation({ summary: 'Set default MFA channel' })
    @ApiBasicResponse(200, 'Default MFA channel set successfully')
    @ApiCommonResponse()
    @Post('mfa/set-default')
    @HttpCode(HttpStatus.OK)
    public async update2FA(@CurrentUser('userId') publicId: Types.ObjectId, @Body() data: SetDefaultMFADto) {
        await this.twoFactorAuth.setDefault(publicId, data.channel);

        return AppMessages.TWO_FACTOR_DEFAULT_SET;
    }

    @ApiOperation({ summary: 'Activate 2FA' })
    @ApiBasicResponse(200, '2FA activated successfully')
    @ApiCommonResponse()
    @Post('mfa/activate')
    @HttpCode(HttpStatus.OK)
    public async activate2FA(@CurrentUser('userId') publicId: Types.ObjectId, @Body() data: Activate2FADto) {
        const response = await this.twoFactorAuth.activate2FA(publicId, data);

        return {
            code: AppStatus.Success,
            data: response,
            message: AppMessages.TWO_FA_ACTIVATED_SUCCESSFUL,
        };
    }

    @ApiOperation({ summary: 'Send MFA code' })
    @ApiBasicResponse(200, 'MFA code sent successfully')
    @ApiCommonResponse()
    @Post('mfa/send')
    @HttpCode(HttpStatus.OK)
    public async send2FA(@CurrentUser('userId') publicId: Types.ObjectId, @Body() body: SendMFADto) {
        return this.twoFactorAuth.sendUserMFA(publicId, body.channel);
    }

    @ApiOperation({ summary: 'Register service integration' })
    @ApiBasicResponse(200, 'Service integration registered successfully')
    @ApiCommonResponse()
    @Post('service-integrations/register')
    @HttpCode(HttpStatus.OK)
    registerServiceIntegration(@CurrentUser() user: JWTUser, @Body() body: RegisterServiceIntegrationDto) {
        return this.userService.registerServiceIntegration(user.userId, body);
    }
}
