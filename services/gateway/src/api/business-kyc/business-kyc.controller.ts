import {
    Body,
    Controller,
    Get,
    Delete,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
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
import { ApiBasicResponse, ApiCommonResponse, ApiResponseWrapper, CurrentUser } from '@common/decorators';
import { JWTUser } from '@auth/jwt.strategy';
import { ApiHydratedBusinessKYC, ApiHydratedBusinessLeadership } from './business-kyc.schema';

@ApiBearerAuth()
@ApiTags('business/kyc')
@Controller('business/kyc')
export class BusinessKYCController {
    constructor(private readonly service: KYCWizardService) {}

    @ApiOperation({ summary: 'Create KYC submission' })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponseWrapper(ApiHydratedBusinessKYC, 201, 'KYC submission created successfully')
    @ApiCommonResponse()
    createKYC(@CurrentUser() user: JWTUser, @Body() body: KYCBusinessInformationDto) {
        return this.service.createKYC(user.businessId, body);
    }

    @ApiOperation({ summary: 'Get KYC submission' })
    @ApiParam({ name: 'id', description: 'KYC submission ID', type: String })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedBusinessKYC, 200, 'KYC submission retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'KYC submission not found')
    getKyc(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto) {
        return this.service.findOne({ _id: param.id, business: user.businessId });
    }

    @ApiOperation({ summary: 'Update business information' })
    @ApiParam({ name: 'id', description: 'KYC submission ID', type: String })
    @Put('/:id/info')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedBusinessKYC, 200, 'Business information updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'KYC submission not found')
    updateBusinessInfo(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamMongoIdDto,
        @Body() body: KYCBusinessInformationDto,
    ) {
        return this.service.updateBusinessInfo(user.businessId, param.id, body);
    }

    @ApiOperation({ summary: 'Update business address' })
    @ApiParam({ name: 'id', description: 'KYC submission ID', type: String })
    @Put('/:id/address')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedBusinessKYC, 200, 'Business address updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'KYC submission not found')
    updateBusinessAddress(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamMongoIdDto,
        @Body() body: KYCBusinessAddressDto,
    ) {
        return this.service.updateBusinessAddress(user.businessId, param.id, body);
    }

    @ApiOperation({ summary: 'Add leadership member' })
    @ApiParam({ name: 'id', description: 'KYC submission ID', type: String })
    @Post('/:id/leadership')
    @HttpCode(HttpStatus.CREATED)
    @ApiResponseWrapper(ApiHydratedBusinessLeadership, 201, 'Leadership member added successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'KYC submission not found')
    addLeadership(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto, @Body() body: KYCLeadershipDto) {
        return this.service.addLeadership(user.businessId, param.id, body);
    }

    @ApiOperation({ summary: 'Delete leadership member' })
    @ApiParam({ name: 'kycId', description: 'KYC submission ID', type: String })
    @ApiParam({ name: 'leadershipId', description: 'Leadership member ID', type: String })
    @Delete('/:kycId/leadership/:leadershipId')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Leadership member deleted successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'KYC submission or leadership member not found')
    async deleteLeadership(@CurrentUser() user: JWTUser, @Param() param: ParamKYCLeadershipMongoIdDto) {
        await this.service.deleteLeadership(user.businessId, param.kycId, param.leadershipId);
    }

    @ApiOperation({ summary: 'Add KYC documentation' })
    @ApiParam({ name: 'id', description: 'KYC submission ID', type: String })
    @ApiConsumes('multipart/form-data')
    @Post('/:id/documentation')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cacCertificate', maxCount: 1 },
            { name: 'applicationDoc', maxCount: 1 },
        ]),
    )
    @ApiResponseWrapper(ApiHydratedBusinessKYC, 201, 'Documentation added successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'KYC submission not found')
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

    @ApiOperation({ summary: 'Update KYC documentation' })
    @ApiParam({ name: 'id', description: 'KYC submission ID', type: String })
    @ApiConsumes('multipart/form-data')
    @Put('/:id/documentation')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cacCertificate', maxCount: 1 },
            { name: 'applicationDoc', maxCount: 1 },
        ]),
    )
    @ApiResponseWrapper(ApiHydratedBusinessKYC, 200, 'Documentation updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'KYC submission not found')
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

    @ApiOperation({ summary: 'Submit KYC for review' })
    @ApiParam({ name: 'id', description: 'KYC submission ID', type: String })
    @Post('/:id/submit')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'KYC submitted for review successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'KYC submission not found')
    submitKyc(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto) {
        return this.service.submitKyc(user.businessId, param.id);
    }
}
