import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@acme.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Str0ngP@ss!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
