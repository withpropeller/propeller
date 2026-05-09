import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitBusinessDto {
  @ApiProperty({ example: 'draft' })
  @IsString()
  @IsNotEmpty()
  kybStatus!: string;
}
