import { DashboardMode } from '@api/users';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UserPreferencesDto {
    @ApiProperty()
    @IsEnum(DashboardMode)
    dashboardMode: DashboardMode;
}

export class PatchProfileDto {
    @ApiProperty({ example: 'John', required: false })
    @IsOptional()
    @IsString()
    readonly firstName: string;

    @ApiProperty({ example: 'Doe', required: false })
    @IsOptional()
    @IsString()
    readonly lastName: string;

    @ApiProperty()
    @ValidateNested()
    @Type(() => UserPreferencesDto)
    preferences: UserPreferencesDto;
}
