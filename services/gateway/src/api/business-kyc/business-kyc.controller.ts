import { Body, Controller, Get, Delete, Param, Post, Put, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
    KYCBusinessInformationDto,
    KYCBusinessAddressDto,
    KYCLeadershipDto,
    ParamKYCLeadershipMongoIdDto,
    KYCDocumentationDto,
    UpdateKYCDocumentationDto,
} from './kyc-dto';
import { KYCWizardService } from './business-kyc.service';
import { ParamMongoIdDto } from '@common/dtos';
import { CurrentUser } from '@common/decorators';
import { JWTUser } from '@auth/jwt.strategy';

@ApiTags('business/kyc')
@Controller('business/kyc')
export class BusinessKYCController {
    constructor(private readonly service: KYCWizardService) {}

    @Post()
    createKYC(@CurrentUser() user: JWTUser, @Body() body: KYCBusinessInformationDto) {
        return this.service.createKYC(user.businessId, body);
    }

    @Get('/:id')
    getKyc(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto) {
        return this.service.findOne({ _id: param.id, business: user.businessId });
    }

    @Put('/:id/info')
    updateBusinessInfo(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamMongoIdDto,
        @Body() body: KYCBusinessInformationDto,
    ) {
        return this.service.updateBusinessInfo(user.businessId, param.id, body);
    }

    @Put('/:id/address')
    updateBusinessAddress(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamMongoIdDto,
        @Body() body: KYCBusinessAddressDto,
    ) {
        return this.service.updateBusinessAddress(user.businessId, param.id, body);
    }

    @Post('/:id/leadership')
    addLeadership(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto, @Body() body: KYCLeadershipDto) {
        return this.service.addLeadership(user.businessId, param.id, body);
    }

    @Delete('/:kycId/leadership/:leadershipId')
    async deleteLeadership(@CurrentUser() user: JWTUser, @Param() param: ParamKYCLeadershipMongoIdDto) {
        await this.service.deleteLeadership(user.businessId, param.kycId, param.leadershipId);
    }

    @Post('/:id/documentation')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cacCertificate', maxCount: 1 },
            { name: 'applicationDoc', maxCount: 1 },
        ]),
    )
    addDocumentations(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamMongoIdDto,
        @UploadedFiles() files: KYCDocumentationDto,
    ) {
        return this.service.addDocumentations(
            user.businessId,
            param.id,
            files.cacCertificate[0],
            files.applicationDoc[0],
        );
    }

    @Put('/:id/documentation')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cacCertificate', maxCount: 1 },
            { name: 'applicationDoc', maxCount: 1 },
        ]),
    )
    updateDocumentations(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamMongoIdDto,
        @UploadedFiles() files: UpdateKYCDocumentationDto,
    ) {
        return this.service.updateDocumentations(
            user.businessId,
            param.id,
            files.cacCertificate ? files.cacCertificate[0] : null,
            files.applicationDoc ? files.applicationDoc[0] : null,
        );
    }

    @Post('/:id/submit')
    submitKyc(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto) {
        return this.service.submitKyc(user.businessId, param.id);
    }
}
