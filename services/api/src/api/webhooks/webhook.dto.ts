import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsArray,
    ArrayNotEmpty,
    IsOptional,
    IsEnum,
    IsNotEmptyObject,
    IsNotEmpty,
    IsUrl,
    IsObject,
    Length,
} from 'class-validator';
import { ApiVersion } from '@core/helpers';
import { WebhookEventTypes } from './webhook.enums';

export class WebhookDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: [WebhookEventTypes.PaymentCompleted],
        isArray: true,
        enum: WebhookEventTypes,
    })
    @IsEnum(WebhookEventTypes, { each: true })
    @IsArray()
    @ArrayNotEmpty()
    events: WebhookEventTypes[];

    @ApiPropertyOptional({ example: ApiVersion.Current, enum: ApiVersion })
    @IsEnum(ApiVersion)
    @IsOptional()
    apiVersion?: ApiVersion;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description?: string;

    @ApiProperty()
    @IsUrl()
    url: string;

    @ApiPropertyOptional()
    @Length(80, 80)
    @IsString()
    @IsOptional()
    signingKey?: string;

    @ApiPropertyOptional()
    @IsObject()
    @IsNotEmptyObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

export class PatchWebhookDto {
    @ApiPropertyOptional()
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name: string;

    @ApiPropertyOptional({
        example: [WebhookEventTypes.PaymentCompleted],
        isArray: true,
        enum: WebhookEventTypes,
    })
    @IsEnum(WebhookEventTypes, { each: true })
    @IsArray()
    @ArrayNotEmpty()
    @IsOptional()
    events: WebhookEventTypes[];

    @ApiPropertyOptional({ example: ApiVersion.Current, enum: ApiVersion })
    @IsEnum(ApiVersion)
    @IsOptional()
    apiVersion?: ApiVersion;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description?: string;

    @ApiPropertyOptional()
    @IsUrl({ require_tld: false })
    @IsOptional()
    url: string;

    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

export class SendEventPayloadDto {
    @ApiProperty({
        example: WebhookEventTypes.PaymentCompleted,
        enum: WebhookEventTypes,
    })
    @IsEnum(WebhookEventTypes)
    event: WebhookEventTypes;

    @ApiProperty()
    @IsObject()
    @IsNotEmptyObject()
    @IsOptional()
    data: Record<string, any>;
}

export class RollSecretWebhookDto {
    @ApiPropertyOptional()
    @Length(80, 80)
    @IsString()
    @IsOptional()
    signingKey?: string;
}
