import { IsEnum, IsNotEmptyObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceIntegrationType } from '@api/users/users.enums';

export class RegisterServiceIntegrationDto {
    @ApiProperty({ example: 'ONESIGNAL' })
    @IsEnum(ServiceIntegrationType)
    service: ServiceIntegrationType;

    @ApiProperty({ example: { id: '5eb5a37e-b458-11' } })
    @IsNotEmptyObject()
    data: Record<string, any>;
}
