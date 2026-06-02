import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiResponse } from '@nestjs/swagger';
import { AppStatus } from '@core/helpers';
import { BasicResponse } from '@common/dtos/response-wrapper';

class APIPaginationData {
    @ApiProperty({ example: 100, description: 'Total number of items available' })
    totalCount: number;

    @ApiProperty({ example: 10, description: 'Indicates if there are more items available beyond the current page' })
    hasMore: boolean;
}

function createConcreteResponseClass<T>(dataType: new () => T) {
    const className = `ResponseWrapper_${dataType.name}`;

    class ConcreteResponse {
        @ApiProperty({ enum: AppStatus, example: AppStatus.Success })
        code: AppStatus;

        @ApiPropertyOptional({ example: 'Request successful' })
        message: string;

        @ApiProperty({ type: dataType, description: 'Response data' })
        data: T;
    }

    Object.defineProperty(ConcreteResponse, 'name', { value: className });
    return ConcreteResponse;
}

function createConcreteListResponseClass<T>(dataType: new () => T) {
    const className = `ResponseWrapper_${dataType.name}_List`;

    class ConcreteResponse {
        @ApiProperty({ enum: AppStatus, example: AppStatus.Success })
        code: AppStatus;

        @ApiProperty({ example: 'Request successful' })
        message: string;

        @ApiPropertyOptional({ type: dataType, description: 'Response data list', isArray: true })
        data: T[];

        @ApiPropertyOptional({ description: 'Pagination metadata', type: APIPaginationData })
        metadata?: APIPaginationData;
    }

    Object.defineProperty(ConcreteResponse, 'name', { value: className });
    return ConcreteResponse;
}

export function ApiResponseWrapper<T>(type: new () => T, status = 200, description?: string) {
    const ConcreteResponse = createConcreteResponseClass(type);
    return applyDecorators(
        ApiResponse({ status, description: description || 'Request successful', type: ConcreteResponse }),
    );
}

export function ApiResponseListWrapper<T>(type: new () => T, status = 200, description?: string) {
    const ConcreteResponse = createConcreteListResponseClass(type);
    return applyDecorators(
        ApiResponse({ status, description: description || 'Request successful', type: ConcreteResponse }),
    );
}

export function ApiBasicResponse(status = 200, description?: string) {
    return applyDecorators(
        ApiResponse({ status, description: description || 'Request successful', type: BasicResponse }),
    );
}

export function ApiCommonResponse() {
    return applyDecorators(
        ApiBasicResponse(400, 'Bad request'),
        ApiBasicResponse(401, 'Unauthorized'),
        ApiBasicResponse(403, 'Forbidden'),
    );
}
