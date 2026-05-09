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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { Response } from 'express';
import { JWTUser } from '@auth/jwt.strategy';
import { ToolsService } from './tools.service';
import { AppException } from '@core/exceptions';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParamIdDto } from '@common/dtos';

@ApiTags('tools')
@Controller('tools')
export class ToolsController {
    constructor(private service: ToolsService) {}

    @ApiOperation({ summary: 'Get Bank list' })
    @Permission(Permissions.ToolsBanksRead)
    @Get('/banks')
    public async get(@CurrentUser() user: JWTUser, @Res() res: Response) {
        const response = await this.service.getAction(user, 'banks');
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Bank Short List' })
    @Permission(Permissions.ToolsBanksRead)
    @Get('/banks/short-list/:id')
    public async getShortBankList(@CurrentUser() user: JWTUser, @Res() res: Response, @Param() param: any) {
        const response = await this.service.getAction(user, `banks/short-list/${param.id}`);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Resolve Bank Account' })
    @Permission(Permissions.ToolsBanksRead)
    @Get('/banks/resolve')
    public async resolve(@CurrentUser() user: JWTUser, @Res() res: Response, @Query() query: any) {
        const response = await this.service.getAction(user, 'banks/resolve', query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Bank list' })
    @Permission(Permissions.ToolsMerchantsRead)
    @Get('/merchants')
    public async getMerchants(@CurrentUser() user: JWTUser, @Res() res: Response, @Query() query: any) {
        const response = await this.service.getAction(user, 'merchants', query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Bank list' })
    @Permission(Permissions.ToolsMerchantsRead)
    @Get('/merchants/:id')
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
    public async getFxRate(@CurrentUser() user: JWTUser, @Res() res: Response, @Query() query: any) {
        const response = await this.service.getAction(user, 'fx/rate', query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get FX Quote' })
    @Permission(Permissions.ToolsFxQuote)
    @Post('/fx/quote')
    public async getFxQuote(@CurrentUser() user: JWTUser, @Res() res: Response, @Body() body: any) {
        const response = await this.service.postAction(user, 'fx/quote', body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get FX Buy Quote' })
    @Post('/fx/quote/buy')
    @Permission(Permissions.ToolsFxQuote)
    public async getFxBuyQuote(@CurrentUser() user: JWTUser, @Res() res: Response, @Body() body: any) {
        const response = await this.service.postAction(user, 'fx/quote/buy', body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get FX Sell Quote' })
    @Post('/fx/quote/sell')
    @Permission(Permissions.ToolsFxQuote)
    public async getFxSellQuote(@CurrentUser() user: JWTUser, @Res() res: Response, @Body() body: any) {
        const response = await this.service.postAction(user, 'fx/quote/sell', body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Upload Temp File' })
    @Post('/temp-file/upload')
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.ToolsTempUpload)
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
    public async deleteUploadTempFile(@Param() param: ParamIdDto) {
        return this.service.deleteUploadTempFile(param.id);
    }
}
