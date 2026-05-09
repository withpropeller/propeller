import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { HmacAuthGuard } from '@propeller/core';
import { BusinessService } from './business.service.js';
import { CreateBusinessDto } from './dto/create-business.dto.js';
import { BusinessResponseDto } from './dto/business-response.dto.js';

@ApiTags('businesses')
@ApiBearerAuth('HMAC-SHA256')
@UseGuards(HmacAuthGuard)
@Controller('v1/businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @ApiCreatedResponse({ type: BusinessResponseDto })
  async create(@Body() dto: CreateBusinessDto): Promise<BusinessResponseDto> {
    return this.businessService.create(dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: BusinessResponseDto })
  async findOne(@Param('id') id: string): Promise<BusinessResponseDto> {
    return this.businessService.findOne(id);
  }

  @Get(':id/balance')
  @ApiOkResponse({ type: Object })
  async getBalance(@Param('id') id: string): Promise<{ available: number; currency: string }> {
    return this.businessService.getBalance(id);
  }
}
