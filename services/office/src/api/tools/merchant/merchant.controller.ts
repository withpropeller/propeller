import { CurrentUser, Permission } from '@common/decorators';
import { APIPagingDto } from '@common/api-paging';
import { ItemArrayStringDto, ParamTagIdDto } from '@common/dtos';
import { Permissions } from '@api/roles';
import {
    Controller,
    Get,
    Put,
    Param,
    Body,
    Delete,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CreateMerchantDto, MatchDescriptorPhraseDto, UpdateMerchantDto } from './merchant.dtos';
import { MerchantService } from './merchant.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JWTUser } from '@auth/jwt.strategy';
import { Request } from 'express';

@ApiTags('tools/merchants')
@Controller('tools/merchants')
export class MerchantController {
    constructor(private service: MerchantService) {}

    @ApiOperation({ summary: 'Get All Merchants' })
    @Get('/')
    @Permission(Permissions.ToolsMerchantsRead)
    public async getMerchants(@Query() query: APIPagingDto) {
        return this.service.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get All Unclassified Merchants Descriptor' })
    @Get('/unclassified')
    @Permission(Permissions.ToolsMerchantsRead)
    public async fetchUnclassified() {
        return this.service.fetchUnclassified();
    }

    @ApiOperation({ summary: 'Remove Unclassified Merchants Descriptor' })
    @Delete('/unclassified')
    @Permission(Permissions.ToolsMerchantsDelete)
    public async removeUnclassified(@Body() body: ItemArrayStringDto) {
        return this.service.removeUnclassified(body.items);
    }

    @ApiOperation({ summary: 'Get One Merchant' })
    @ApiParam({ name: 'id', description: 'Merchant ID', type: String })
    @Get('/:id')
    @Permission(Permissions.ToolsMerchantsRead)
    public async getOneMerchant(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.findOneWithOptions({
            conditions: { _id: param.id },
            expand: query.expand,
            select: query.select,
        });
    }

    @ApiOperation({ summary: 'Update Merchant' })
    @ApiParam({ name: 'id', description: 'Merchant ID', type: String })
    @Put('/:id')
    @Permission(Permissions.ToolsMerchantsUpdate)
    public async update(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Param() param: ParamTagIdDto,
        @Body() body: UpdateMerchantDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.update(user.userId, param.id, body, query, req);
    }

    @ApiOperation({ summary: 'Delete Merchant' })
    @ApiParam({ name: 'id', description: 'Merchant ID', type: String })
    @Delete('/:id')
    @Permission(Permissions.ToolsMerchantsDelete)
    public async deleteMerchants(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.delete(user.userId, param.id, query, req);
    }

    @ApiOperation({ summary: 'Create Merchant' })
    @Post('/')
    @Permission(Permissions.ToolsMerchantsCreate)
    public async create(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Body() body: CreateMerchantDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.create(user.userId, body, query, req);
    }

    @ApiOperation({ summary: 'Upload Icon' })
    @ApiParam({ name: 'id', description: 'Merchant ID', type: String })
    @Put('/:id/upload-icon')
    @UseInterceptors(FileInterceptor('icon'))
    @Permission(Permissions.ToolsMerchantsUpdate)
    public async updateIconIconUrl(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Param() param: ParamTagIdDto,
        @UploadedFile() file: Express.Multer.File,
        @Query() query: APIPagingDto,
    ) {
        return this.service.updateIcon(user.userId, param.id, file, query, req);
    }

    @ApiOperation({ summary: 'Match Merchant Descriptor Phrase' })
    @Post('/match')
    @Permission(Permissions.ToolsMerchantsRead)
    public async matchDescriptor(@Body() body: MatchDescriptorPhraseDto) {
        return this.service.fetchMerchantWithPhrase(body);
    }
}
