import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CloudflareAccessGuard } from '@propeller/core';
import { AdminService } from './admin.service.js';
import { ListBusinessesDto } from './dto/list-businesses.dto.js';
import { ApproveBusinessDto } from './dto/approve-business.dto.js';
import { BusinessDetailDto } from './dto/business-detail.dto.js';

@ApiTags('admin')
@ApiBearerAuth('CF-Access-Jwt-Assertion')
@UseGuards(CloudflareAccessGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('businesses')
  @ApiOkResponse({ type: [BusinessDetailDto] })
  async listBusinesses(@Query() query: ListBusinessesDto): Promise<BusinessDetailDto[]> {
    return this.adminService.listBusinesses(query);
  }

  @Get('businesses/:id')
  @ApiOkResponse({ type: BusinessDetailDto })
  async getBusinessDetail(@Param('id') id: string): Promise<BusinessDetailDto> {
    return this.adminService.getBusinessDetail(id);
  }

  @Post('businesses/:id/approve')
  @ApiOkResponse({ type: BusinessDetailDto })
  async approveBusiness(
    @Param('id') id: string,
    @Body() dto: ApproveBusinessDto,
  ): Promise<BusinessDetailDto> {
    return this.adminService.approveBusiness(id, dto);
  }
}
