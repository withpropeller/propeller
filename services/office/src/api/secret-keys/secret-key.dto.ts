import { CIDR } from '@common/decorators/validators.decorators';
import { ApiVersions } from '@core/helpers/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';
import { SecretKeyScopes } from './secret-key.enums';

export class CreateSecretKeyDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ example: [SecretKeyScopes.Cards] })
    @IsEnum(SecretKeyScopes, { each: true })
    @IsArray()
    @ArrayNotEmpty()
    readonly scopes: SecretKeyScopes[];

    @ApiProperty({ example: ['2023-02-01'] })
    @IsEnum(ApiVersions)
    @IsOptional()
    readonly apiVersion: ApiVersions;

    @ApiProperty({ example: [] })
    @Validate(CIDR, { each: true })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    readonly cidrWhitelist?: string[];
}

export class PatchSecretKeyDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly name: string;

    @ApiProperty({ example: [SecretKeyScopes.Cards] })
    @IsEnum(SecretKeyScopes, { each: true })
    @IsArray()
    @ArrayNotEmpty()
    @IsOptional()
    readonly scopes: SecretKeyScopes[];

    @ApiPropertyOptional({ example: ['2023-02-01'] })
    @IsEnum(ApiVersions)
    @IsOptional()
    readonly apiVersion: ApiVersions;

    @ApiProperty({ example: [] })
    @Validate(CIDR, { each: true })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    readonly cidrWhitelist?: string[];
}
