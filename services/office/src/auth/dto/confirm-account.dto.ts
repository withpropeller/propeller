import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmAccountDto {
    @ApiProperty()
    @IsString()
    token: string;
}
