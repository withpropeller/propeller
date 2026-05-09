import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveBusinessDto {
  @ApiProperty({ example: 'approved', enum: ['approved', 'rejected', 'manual-review'] })
  @IsString()
  @IsNotEmpty()
  action!: string;

  @ApiPropertyOptional({ example: 'Additional documents required' })
  @IsString()
  @IsOptional()
  reason?: string;
}
