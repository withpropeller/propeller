import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
