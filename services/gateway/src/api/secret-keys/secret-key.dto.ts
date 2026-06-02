import { CIDR } from '@common/decorators/validators.decorators';
import { ApiVersions } from '@core/helpers/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, Validate } from 'class-validator';
import { SecretKeyScopes } from './secret-key.enums';

export class SecretKeyMetricsDto {
    @ApiPropertyOptional({ description: 'Number of days for daily breakdown', default: 7 })
    @IsNumberString()
    @IsOptional()
    readonly days?: string = '7';
}

export class SecretKeyDailyStats {
    @ApiProperty({ description: 'Date (YYYY-MM-DD)', type: String })
    date: string;

    @ApiProperty({ description: 'Request count for this day', type: Number })
    count: number;
}

export class SecretKeyMetricsResponseDto {
    @ApiProperty({ description: 'Requests made today', type: Number })
    requestsToday: number;

    @ApiProperty({ description: 'Errors today (responses with status code >= 400)', type: Number })
    errorsToday: number;

    @ApiProperty({ description: 'Total lifetime requests', type: Number })
    totalRequests: number;

    @ApiProperty({ description: 'Daily request breakdown for requested period', type: [SecretKeyDailyStats] })
    dailyStats: SecretKeyDailyStats[];
}

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

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    readonly grpEnabled?: boolean;
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

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    readonly grpEnabled?: boolean;
}
