import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppStatus } from '@core/helpers';

export class BasicResponse {
    @ApiProperty({ enum: AppStatus, example: AppStatus.Success })
    code: AppStatus;

    @ApiPropertyOptional({ example: 'Request successful' })
    message: string;

    constructor(message = 'Request successful') {
        this.code = AppStatus.Success;
        this.message = message;
    }
}
