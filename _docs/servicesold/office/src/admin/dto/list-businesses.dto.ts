import { IsEnum, IsOptional, IsString } from 'class-validator';
import { APIPagingDto } from '@propeller/core';

export class ListBusinessesDto extends APIPagingDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  kybStatus?: string;
}
