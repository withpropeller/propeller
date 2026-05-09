import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { SessionAuthGuard } from '@propeller/core';
import { PublicService } from './public.service';
import { SignupDto } from './dto/signup.dto';
import { CreateBusinessDto } from './dto/create-business.dto';
import { SubmitBusinessDto } from './dto/submit-business.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { BusinessResponseDto } from './dto/business-response.dto';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Post('signup')
  @ApiCreatedResponse({ type: UserResponseDto })
  async signup(@Body() dto: SignupDto): Promise<UserResponseDto> {
    return this.publicService.signup(dto);
  }

  @Post('businesses')
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ type: BusinessResponseDto })
  async createBusiness(@Body() dto: CreateBusinessDto): Promise<BusinessResponseDto> {
    return this.publicService.createBusiness(dto);
  }

  @Post('businesses/:id/documents')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ type: Object })
  async uploadDocuments(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ): Promise<{ fileId: string }> {
    return this.publicService.uploadDocuments(id, body);
  }

  @Post('businesses/:id/submit')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ type: BusinessResponseDto })
  async submitBusiness(
    @Param('id') id: string,
    @Body() dto: SubmitBusinessDto,
  ): Promise<BusinessResponseDto> {
    return this.publicService.submitBusiness(id, dto);
  }
}
