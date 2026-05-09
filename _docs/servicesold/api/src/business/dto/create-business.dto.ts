import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'NG' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiPropertyOptional({ example: 'fashion_apparel' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ example: 'RC123456' })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiProperty({ example: 'legal.rep@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  legalRepEmail!: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString()
  @IsOptional()
  legalRepPhone?: string;
}
