import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Permissions } from '../roles.enums';

export class AddRolePermissionDto {
    @ApiProperty()
    @IsEnum(Permissions, { each: true })
    readonly permissions: Permissions[];
}

export class AddUserRolesDto {
    @ApiProperty()
    @IsMongoId({ each: true })
    @ArrayNotEmpty()
    roles: string[];
}

export class CreateRolesDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty()
    @IsEnum(Permissions, { each: true })
    @ArrayNotEmpty()
    permissions: Permissions[];
}
