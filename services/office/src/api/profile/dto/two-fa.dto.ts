import { TwoFAChannels } from '@auth/auth.enums';
import { MessagingChannel } from '@core/helpers/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNumberString,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MaxLength,
    MinLength,
    ValidateIf,
} from 'class-validator';

export class Setup2FADto {
    @ApiProperty()
    @IsEnum(TwoFAChannels)
    readonly channel: TwoFAChannels;

    @ApiProperty({ example: 'secret' })
    @IsString()
    @Transform((s) => s.value.trim())
    readonly password: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    readonly default: boolean;

    @ApiPropertyOptional({ example: '+23480123456' })
    @ValidateIf((o) => o.channel === TwoFAChannels.Phone)
    @IsPhoneNumber('ZZ' as any)
    readonly phoneNumber?: string;

    @ApiPropertyOptional({ example: 'SMS' })
    @ValidateIf((o) => o.channel === TwoFAChannels.Phone)
    @IsEnum(MessagingChannel)
    readonly messagingChannel?: MessagingChannel;
}

export class Activated2FADto {
    @ApiProperty()
    @IsEnum(TwoFAChannels)
    readonly channel: TwoFAChannels;

    @ApiProperty()
    @IsNumberString()
    @MaxLength(6)
    @MinLength(6)
    readonly token: string;
}

export class SendMFADto {
    @ApiProperty()
    @IsEnum(TwoFAChannels)
    readonly channel: TwoFAChannels;
}

export class RecoverMFADto {
    @ApiProperty()
    @IsEnum(TwoFAChannels)
    readonly channel: TwoFAChannels;

    @ApiPropertyOptional({ example: '+23480123456' })
    @ValidateIf((o) => o.channel === TwoFAChannels.Phone)
    @IsPhoneNumber('ZZ' as any)
    readonly phoneNumber?: string;

    @ApiPropertyOptional({ example: 'SMS' })
    @ValidateIf((o) => o.channel === TwoFAChannels.Phone)
    @IsEnum(MessagingChannel)
    readonly messagingChannel?: MessagingChannel;

    @ApiProperty()
    @IsString()
    readonly recoveryKey: string;
}

export class SetDefaultMFADto {
    @ApiProperty()
    @IsEnum(TwoFAChannels)
    readonly channel: TwoFAChannels;
}
