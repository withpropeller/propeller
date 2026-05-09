import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateAccountDto {
    @ApiProperty({ example: 'Adekunle' })
    @IsString()
    @IsNotEmpty()
    readonly firstName: string;

    @ApiProperty({ example: 'Ciroma' })
    @IsString()
    @IsNotEmpty()
    readonly lastName: string;

    @ApiProperty({ example: 'secret' })
    @IsString()
    @Transform((s) => s.value.trim())
    readonly password: string;
}
