import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiBasicResponse, ApiCommonResponse, CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { Response } from 'express';
import { JWTUser } from '@auth/jwt.strategy';
import { ToolsService } from './tools.service';
import { AppException } from '@core/exceptions';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParamIdDto } from '@common/dtos';

@ApiTags('tools')
@ApiBearerAuth()
@Controller('tools')
export class ToolsController {
    constructor(private service: ToolsService) {}

    @ApiOperation({ summary: 'Get Bank List' })
    @Permission(Permissions.ToolsBanksRead)
    @Get('/banks')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Bank list retrieved successfully')
    @ApiCommonResponse()
    public async get(@CurrentUser() user: JWTUser, @Res() res: Response) {
        const response = await this.service.getAction(user, 'banks');
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Bank Short List' })
    @Permission(Permissions.ToolsBanksRead)
    @Get('/banks/short-list/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Bank ID', type: String })
    @ApiBasicResponse(200, 'Bank short list retrieved successfully')
    @ApiCommonResponse()
    public async getShortBankList(@CurrentUser() user: JWTUser, @Res() res: Response, @Param() param: any) {
        const response = await this.service.getAction(user, `banks/short-list/${param.id}`);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Resolve Bank Account' })
    @Permission(Permissions.ToolsBanksRead)
    @Get('/banks/resolve')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Bank account resolved successfully')
    @ApiCommonResponse()
    public async resolve(@CurrentUser() user: JWTUser, @Res() res: Response, @Query() query: any) {
        const response = await this.service.getAction(user, 'banks/resolve', query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Merchant List' })
    @Permission(Permissions.ToolsMerchantsRead)
    @Get('/merchants')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Merchant list retrieved successfully')
    @ApiCommonResponse()
    public async getMerchants(@CurrentUser() user: JWTUser, @Res() res: Response, @Query() query: any) {
        const response = await this.service.getAction(user, 'merchants', query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get One Merchant' })
    @Permission(Permissions.ToolsMerchantsRead)
    @Get('/merchants/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Merchant ID', type: String })
    @ApiBasicResponse(200, 'Merchant retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Merchant not found')
    public async getOneMerchant(
        @CurrentUser() user: JWTUser,
        @Res() res: Response,
        @Param() param: any,
        @Query() query: any,
    ) {
        const response = await this.service.getAction(user, `merchants/${param.id}`, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Current FX Rate' })
    @Permission(Permissions.ToolsFxRate)
    @Get('/fx/rate')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'FX rate retrieved successfully')
    @ApiCommonResponse()
    public async getFxRate(@CurrentUser() user: JWTUser, @Res() res: Response, @Query() query: any) {
        const response = await this.service.getAction(user, 'fx/rate', query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get FX Quote' })
    @Permission(Permissions.ToolsFxQuote)
    @Post('/fx/quote')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'FX quote retrieved successfully')
    @ApiCommonResponse()
    public async getFxQuote(@CurrentUser() user: JWTUser, @Res() res: Response, @Body() body: any) {
        const response = await this.service.postAction(user, 'fx/quote', body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get FX Buy Quote' })
    @Post('/fx/quote/buy')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.ToolsFxQuote)
    @ApiBasicResponse(200, 'FX buy quote retrieved successfully')
    @ApiCommonResponse()
    public async getFxBuyQuote(@CurrentUser() user: JWTUser, @Res() res: Response, @Body() body: any) {
        const response = await this.service.postAction(user, 'fx/quote/buy', body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get FX Sell Quote' })
    @Post('/fx/quote/sell')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.ToolsFxQuote)
    @ApiBasicResponse(200, 'FX sell quote retrieved successfully')
    @ApiCommonResponse()
    public async getFxSellQuote(@CurrentUser() user: JWTUser, @Res() res: Response, @Body() body: any) {
        const response = await this.service.postAction(user, 'fx/quote/sell', body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Upload Temp File' })
    @Post('/temp-file/upload')
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.ToolsTempUpload)
    @ApiConsumes('multipart/form-data')
    @ApiBasicResponse(200, 'File uploaded successfully')
    @ApiCommonResponse()
    public async uploadTempFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw AppException.BAD_REQUEST.setMessage('Requires file');
        }
        return this.service.uploadTempFile(file);
    }

    @ApiOperation({ summary: 'Delete Temp File' })
    @Delete('/temp-file/:id')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.ToolsTempDelete)
    @ApiParam({ name: 'id', description: 'Temp file key', type: String })
    @ApiBasicResponse(200, 'File deleted successfully')
    @ApiCommonResponse()
    public async deleteUploadTempFile(@Param() param: ParamIdDto) {
        return this.service.deleteUploadTempFile(param.id);
    }
}
