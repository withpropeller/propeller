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

/**
 * Creates a concrete response class for Swagger documentation
 */
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

    // Set the class name for Swagger schema generation
    Object.defineProperty(ConcreteResponse, 'name', { value: className });

    return ConcreteResponse;
}

/**
 * Creates a concrete response class for Swagger documentation (Array variant)
 */
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

/**
 * Decorator that creates a wrapped API response using the global ResponseWrapper
 * @param type - The data type to wrap
 * @param status - HTTP status code (default: 200)
 * @param description - Response description
 */
export function ApiResponseWrapper<T>(type: new () => T, status = 200, description?: string) {
    const ConcreteResponse = createConcreteResponseClass(type);

    return applyDecorators(
        ApiResponse({
            status,
            description: description || 'Request successful',
            type: ConcreteResponse,
        }),
    );
}

/**
 * Decorator that creates a wrapped API response for array payloads using the global ResponseWrapper
 * @param type - The element data type to wrap
 * @param status - HTTP status code (default: 200)
 * @param description - Response description
 */
export function ApiResponseListWrapper<T>(type: new () => T, status = 200, description?: string) {
    const ConcreteResponse = createConcreteListResponseClass(type);

    return applyDecorators(
        ApiResponse({
            status,
            description: description || 'Request successful',
            type: ConcreteResponse,
        }),
    );
}

/**
 * Helper function to create multiple response wrappers for different scenarios
 * @param responses - Array of response configurations
 */
export function ApiResponseWrappers(
    responses: Array<{
        type: new () => any;
        status?: number;
        description?: string;
    }>,
) {
    return applyDecorators(
        ...responses.map((response) => ApiResponseWrapper(response.type, response.status, response.description)),
    );
}

/**
 * Decorator for basic success responses (no data property)
 * @param status - HTTP status code (default: 200)
 * @param description - Response description
 */
export function ApiBasicResponse(status = 200, description?: string) {
    return applyDecorators(
        ApiResponse({
            status,
            description: description || 'Request successful',
            type: BasicResponse,
        }),
    );
}

/**
 * Helper function to create multiple basic response decorators for different scenarios
 * @param responses - Array of response configurations
 */
export function ApiBasicResponses(
    responses: Array<{
        status?: number;
        description?: string;
    }>,
) {
    return applyDecorators(...responses.map((response) => ApiBasicResponse(response.status, response.description)));
}

/**
 * Decorator for common error responses (400, 401, 403)
 * Used to standardize error response documentation across all endpoints
 */
export function ApiCommonResponse() {
    return applyDecorators(
        ApiBasicResponse(400, 'Bad request'),
        ApiBasicResponse(401, 'Unauthorized'),
        ApiBasicResponse(403, 'Forbidden'),
    );
}

/**
 * Creates a concrete key-value response class for Swagger documentation
 */
function createConcreteKVResponseClass() {
    const className = 'ResponseWrapper_KeyValue';

    class ConcreteResponse {
        @ApiProperty({ enum: AppStatus, example: AppStatus.Success })
        code: AppStatus;

        @ApiPropertyOptional({ example: 'Request successful' })
        message: string;

        @ApiProperty({
            type: 'object',
            additionalProperties: { type: 'boolean' },
            description: 'Key-value pairs with boolean values',
            example: { service1: true, service2: false },
        })
        data: Record<string, boolean>;
    }

    Object.defineProperty(ConcreteResponse, 'name', { value: className });
    return ConcreteResponse;
}

/**
 * Decorator that creates a wrapped API response for key-value payloads
 * @param status - HTTP status code (default: 200)
 * @param description - Response description
 */
export function ApiKVResponse(status = 200, description?: string) {
    const ConcreteResponse = createConcreteKVResponseClass();

    return applyDecorators(
        ApiResponse({
            status,
            description: description || 'Request successful',
            type: ConcreteResponse,
        }),
    );
}
