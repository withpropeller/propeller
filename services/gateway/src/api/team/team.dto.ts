import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsMongoId, IsString, ArrayNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class TeamInviteUserDto {
    @ApiProperty({ description: 'Email address of the user to invite' })
    @IsEmail()
    @Transform((s) => s.value.toLowerCase())
    readonly email: string;

    @ApiProperty({ description: 'List of role names to assign to the invited user', example: ['admin'] })
    @IsString({ each: true })
    @IsArray()
    @ArrayNotEmpty()
    roles: string[];
}

export class DeactivateTeamMemberDto {
    @ApiProperty({ description: 'ID of the team member to deactivate' })
    @IsMongoId()
    readonly userId: string;
}
