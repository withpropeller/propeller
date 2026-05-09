import { Body, Controller, Get, Post, Put, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Admin } from '@api/admins/admin.schema';
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
import { AdminService } from '@api/admins/admin.service';
import { Permissions } from '@api/roles';

@ApiBearerAuth()
@ApiTags('me')
@Controller('me')
export class ProfileController {
    constructor(private readonly userService: AdminService, private readonly twoFactorAuth: MultiFactorAuth) {}

    @Get()
    @UseInterceptors(MongooseSerializerInterceptor(Admin))
    @ApiOperation({ summary: 'Get profile details' })
    @Permission(Permissions.ProfileRead)
    get(@CurrentUser('userId') publicId: string, @Query() query: APIPagingDto) {
        return this.userService.findOneAndPopulate({ _id: publicId }, query.expand);
    }

    // TODO
    @ApiOperation({ summary: 'Profile Update Route' })
    @Put('/')
    @Permission(Permissions.ProfileUpdate)
    public async updateProfile(@CurrentUser() user: JWTUser, @Body() body: PatchProfileDto) {
        const profileUpdates = Utils.removeNilValues({
            firstName: body.firstName,
            lastName: body.lastName,
            preferences: body.preferences,
        });

        await this.userService.updateById(user.userId, profileUpdates);
    }

    /**
     * Get MFA profile
     *
     */
    @ApiOperation({ summary: 'Get MFA profile' })
    @Get('mfa')
    @Permission(Permissions.ProfileRead)
    public async getMFA(@CurrentUser() jwt: JWTUser) {
        const user = await this.userService.findById(jwt.userId);

        const userJson = user.toObject();

        return Utils.pickKeys(userJson.multiFactors, '-recoveryKeyHash -secret');
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Set up 2FA' })
    @Post('mfa/setup')
    @Permission(Permissions.ProfileUpdate)
    public async setup2FA(@CurrentUser() user: JWTUser, @Body() data: Setup2FADto) {
        const response = await this.twoFactorAuth.setup2FA(user.userId, data, true);

        return {
            code: AppStatus.Success,
            data: response,
            message: AppMessages.TWO_FACTOR_ACTIVATION_NEEDED,
        };
    }

    @ApiOperation({ summary: 'Deactivate 2FA' })
    @Post('mfa/deactivate')
    @Permission(Permissions.ProfileUpdate)
    public async deactivate2FA(@CurrentUser() user: JWTUser, @Body() data: Setup2FADto) {
        await this.twoFactorAuth.deactivate2FA(user.userId, data, true);

        return AppMessages.TWO_FA_DEACTIVATED_SUCCESSFUL;
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Confirm User Email' })
    @Post('mfa/set-default')
    @Permission(Permissions.ProfileUpdate)
    public async update2FA(@CurrentUser() user: JWTUser, @Body() data: SetDefaultMFADto) {
        await this.twoFactorAuth.setDefault(user.userId, data.channel);

        return AppMessages.TWO_FACTOR_DEFAULT_SET;
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Confirm User Email' })
    @Post('mfa/activate')
    @Permission(Permissions.ProfileUpdate)
    public async activate2FA(@CurrentUser() user: JWTUser, @Body() data: Activate2FADto) {
        const response = await this.twoFactorAuth.activate2FA(user.userId, data);

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
    @Permission(Permissions.ProfileUpdate)
    public async send2FA(@CurrentUser() user: JWTUser, @Body() body: SendMFADto) {
        return this.twoFactorAuth.sendUserMFA(user.userId, body.channel);
    }

    @ApiOperation({ summary: 'Register Service Integration' })
    @Post('service-integrations/register')
    @Permission(Permissions.ProfileUpdate)
    registerServiceIntegration(@CurrentUser() user: JWTUser, @Body() body: RegisterServiceIntegrationDto) {
        return this.userService.registerServiceIntegration(user.userId, body);
    }
}
