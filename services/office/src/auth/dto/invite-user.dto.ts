import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsArray, ArrayNotEmpty } from 'class-validator';

export class InviteUserDto {
    @ApiProperty()
    @IsEmail()
    readonly email: string;

    @ApiProperty({ example: ['admin'] })
    @IsString({ each: true })
    @IsArray()
    @ArrayNotEmpty()
    roles: string[];
}
