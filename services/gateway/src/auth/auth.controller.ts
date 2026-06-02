import { Controller, Post, Body, HttpStatus, HttpCode, Get, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppMessages, AppStatus, Utils } from '@core/helpers';
import { CurrentUser } from '@common/decorators';
import { SendEmailConfirmationDto } from './dto/send-email.confirmation.dto';
import { SigninDto } from './dto/signin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '@common/decorators/public-request.decorator';
import { ActivateAccountDto } from './dto/activate-account';
import { AuthService } from './auth.service';
import { OnboardSurveyService } from '@auth/onboard/onboard-survey.service';
import { OnboardSurveyDto } from './onboard/onboard-survey.dto';
import { OnboardSurvey } from './onboard/onboard-survey.schema';
import { MongooseSerializerInterceptor } from '@core/interceptors';
import { MultiFactorAuth } from './multi-factor.auth';
import { StateTokenGuard } from './guards/state-token.guard';
import { RecoverMFADto, SendMFADto } from '@api/profile/dto/two-fa.dto';
import { JWTUser } from './jwt.strategy';
import { validatePasswordStrength } from './auth.utils';
import { Types } from 'mongoose';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private mfa: MultiFactorAuth,
        private onboardService: OnboardSurveyService,
    ) {}

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
    async getMFASettings(@CurrentUser('userId') publicId: Types.ObjectId) {
        const multiFactors = await this.mfa.getMFASettings(publicId);

        //set security
        const stateToken = await this.authService.setStateToken(publicId);

        return { multiFactors, stateToken };
    }

    @ApiOperation({ summary: 'Sign in' })
    @Post('/mfa/send')
    @Public()
    @UseGuards(StateTokenGuard)
    @HttpCode(HttpStatus.OK)
    async sendMFA(@CurrentUser('userId') publicId: Types.ObjectId, @Body() body: SendMFADto) {
        await this.mfa.sendUserMFA(publicId, body.channel);

        //set security
        const stateToken = await this.authService.setStateToken(publicId);

        return { stateToken };
    }

    @ApiOperation({ summary: 'Recover MFA' })
    @Post('/mfa/recover')
    @Public()
    @UseGuards(StateTokenGuard)
    @HttpCode(HttpStatus.OK)
    async recoverMFA(@CurrentUser('userId') publicId: Types.ObjectId, @Body() body: RecoverMFADto) {
        const response = await this.mfa.recoverMFA(publicId, body);

        //set security
        const stateToken = await this.authService.setStateToken(publicId);

        return {
            code: AppStatus.Success,
            data: { ...response, stateToken },
            message: AppMessages.SUCCESS,
        };
    }

    @ApiOperation({ summary: 'Create Onboard Wizard' })
    @Public()
    @Post('/onboard')
    @UseInterceptors(MongooseSerializerInterceptor(OnboardSurvey))
    public async create(@Body() body: OnboardSurveyDto) {
        if (body.password) {
            validatePasswordStrength(body.password);
        }

        const onboard = await this.onboardService.saveOnboard(body);

        await this.onboardService.onboardBusiness(onboard);

        return {
            code: HttpStatus.CREATED,
            message: 'Successfully registered account',
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
    async resetPasswordByToken(@CurrentUser('userId') publicId: string, @Body() resetPasswordDto: ResetPasswordDto) {
        await this.authService.resetPasswordByToken(publicId, resetPasswordDto);

        return {
            code: HttpStatus.OK,
            message: AppMessages.PASSWORD_RESET_SUCCESSFUL,
        };
    }

    @ApiBearerAuth()
    @Post('password/change')
    async changePassword(@CurrentUser('userId') publicId: Types.ObjectId, @Body() data: ChangePasswordDto) {
        return this.authService.changePassword(publicId, data);
    }

    /**
     * Basically route to confirm user account
     *
     */
    @ApiOperation({ summary: 'Confirm User Email' })
    @Public()
    @Post('account/activate')
    @UseGuards(StateTokenGuard)
    public async activateAccount(@CurrentUser('userId') publicId: Types.ObjectId, @Body() data: ActivateAccountDto) {
        await this.authService.activateAccount(publicId, data);

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
    public async getAccountInfo(@CurrentUser('userId') publicId: Types.ObjectId) {
        const user = await this.authService.getAccountInfo(publicId);

        const business = Utils.pickKeys(user.business, 'name');
        const userInfo = Utils.pickKeys(user, 'email');

        //set security
        const stateToken = await this.authService.setStateToken(user.id);

        return { stateToken, user: { ...userInfo, businessName: business.name } };
    }
}
