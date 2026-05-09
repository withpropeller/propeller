import { Controller, Post, Body, HttpStatus, HttpCode, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppMessages, AppStatus, Utils } from '@core/helpers';
import { CurrentUser, Permission } from '@common/decorators';
import { SendEmailConfirmationDto } from './dto/send-email.confirmation.dto';
import { SigninDto } from './dto/signin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '@common/decorators/public-request.decorator';
import { ActivateAccountDto } from './dto/activate-account';
import { AuthService } from './auth.service';
import { MultiFactorAuth } from './multi-factor.auth';
import { StateTokenGuard } from './guards/state-token.guard';
import { RecoverMFADto, SendMFADto } from '@api/profile/dto/two-fa.dto';
import { JWTUser } from './jwt.strategy';
import { Permissions } from '@api/roles/roles.enums';
import { InviteUserDto } from './dto/invite-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private mfa: MultiFactorAuth) {}

    @ApiOperation({ summary: 'Sign in' })
    @Post()
    @Public()
    @HttpCode(HttpStatus.OK)
    async getAuthToken(@Body() data: SigninDto) {
        return this.authService.getAuthToken(data);
    }

    @ApiOperation({ summary: 'Sign in' })
    @Get('/mfa')
    @Public()
    @UseGuards(StateTokenGuard)
    @HttpCode(HttpStatus.OK)
    async getMFASettings(@CurrentUser() user: JWTUser) {
        const multiFactors = await this.mfa.getMFASettings(user.userId);

        //set security
        const stateToken = await this.authService.setStateToken(user.userId);

        return { multiFactors, stateToken };
    }

    @ApiOperation({ summary: 'Sign in' })
    @Post('/mfa/send')
    @Public()
    @UseGuards(StateTokenGuard)
    @HttpCode(HttpStatus.OK)
    async sendMFA(@CurrentUser() user: JWTUser, @Body() body: SendMFADto) {
        await this.mfa.sendUserMFA(user.userId, body.channel);

        //set security
        const stateToken = await this.authService.setStateToken(user.userId);

        return { stateToken };
    }

    @ApiOperation({ summary: 'Recover MFA' })
    @Post('/mfa/recover')
    @Public()
    @UseGuards(StateTokenGuard)
    @HttpCode(HttpStatus.OK)
    async recoverMFA(@CurrentUser() user: JWTUser, @Body() body: RecoverMFADto) {
        const response = await this.mfa.recoverMFA(user.userId, body);

        //set security
        const stateToken = await this.authService.setStateToken(user.userId);

        return {
            code: AppStatus.Success,
            data: { ...response, stateToken },
            message: AppMessages.SUCCESS,
        };
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Confirm User Email' })
    @Public()
    @UseGuards(StateTokenGuard)
    @Post('confirm/email')
    public async confirmAccount(@CurrentUser() user: JWTUser) {
        await this.authService.confirmEmail(user);

        return AppMessages.EMAIL_CONFIRMED;
    }

    @ApiOperation({ summary: 'Resend email confirmation' })
    @Post('send-confirm/email')
    @Public()
    async sendConfirmation(@Body() data: SendEmailConfirmationDto) {
        await this.authService.sendEmailConfirmation(data.email);
        return AppMessages.CONFIRMATION_EMAIL_SENT;
    }

    @Public()
    @Post('password/forgot')
    async sendResetPasswordToken(@Body() forgotPasswordDto: ForgotPasswordDto) {
        await this.authService.sendResetPasswordToken(forgotPasswordDto);

        return {
            code: HttpStatus.OK,
            message: AppMessages.PASSWORD_RESET_EMAIL_SENT,
        };
    }

    @Public()
    @Post('password/reset')
    @UseGuards(StateTokenGuard)
    async resetPasswordByToken(@CurrentUser() user: JWTUser, @Body() resetPasswordDto: ResetPasswordDto) {
        await this.authService.resetPasswordByToken(user.userId, resetPasswordDto);

        return {
            code: HttpStatus.OK,
            message: AppMessages.PASSWORD_RESET_SUCCESSFUL,
        };
    }

    @ApiBearerAuth()
    @Post('password/change')
    async changePassword(@CurrentUser() user: JWTUser, @Body() data: ChangePasswordDto) {
        return this.authService.changePassword(user.userId, data);
    }

    /**
     * Basically route to invite user account
     *
     */
    @ApiOperation({ summary: 'Invite admin user' })
    @Permission(Permissions.AdminInvite)
    @Post('account/invite')
    public async inviteAccount(@CurrentUser() admin: JWTUser, @Body() body: InviteUserDto) {
        await this.authService.inviteUser(admin.userId, body);

        return 'Successfully Invited user';
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Confirm User Email' })
    @Public()
    @Post('account/activate')
    @UseGuards(StateTokenGuard)
    public async activateAccount(@CurrentUser() user: JWTUser, @Body() data: ActivateAccountDto) {
        await this.authService.activateAccount(user.userId, data);

        return AppMessages.ACCOUNT_ACTIVATED_SUCCESSFUL;
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Get Info of an Account' })
    @Public()
    @Get('account/info')
    @UseGuards(StateTokenGuard)
    public async getAccountInfo(@CurrentUser('userId') publicId: string) {
        const user = await this.authService.getAccountInfo(publicId);

        const userInfo = Utils.pickKeys(user, 'email');

        //set security
        const stateToken = await this.authService.setStateToken(user.id);

        return { stateToken, user: { ...userInfo } };
    }
}
