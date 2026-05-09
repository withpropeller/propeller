import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppStatus } from '@core/helpers';

/**
 * Global response wrapper that matches the ResponseTransformInterceptor format
 */
export class ResponseWrapper<T> {
    @ApiProperty({ enum: AppStatus, example: AppStatus.Success })
    code: AppStatus;

    @ApiProperty({ example: 'Request successful' })
    message: string;

    @ApiProperty({ description: 'Response data' })
    data: T;

    constructor(data: T, message = 'Request successful') {
        this.code = AppStatus.Success;
        this.message = message;
        this.data = data;
    }
}

/**
 * Basic response for simple success messages (no data property)
 */
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
