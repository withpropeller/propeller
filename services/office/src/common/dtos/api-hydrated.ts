import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic function to create API hydrated document classes
 * Adds MongoDB document properties (id, createdAt, updatedAt) to any schema class
 *
 * @param BaseClass - The base schema class to extend
 * @returns A new class that extends the base class with API properties
 *
 * @example
 * ```typescript
 * const ApiHydratedAdmin = ApiHydrated(Admin);
 * const ApiHydratedCard = ApiHydrated(Card);
 * const ApiHydratedAccount = ApiHydrated(Account);
 * ```
 */
export function ApiHydrated<T extends new (...args: any[]) => any>(BaseClass: T) {
    class ApiHydratedDocument extends BaseClass {
        @ApiProperty({ description: 'Document id' })
        id: string;

        @ApiProperty({ description: 'Document created at' })
        createdAt: Date;

        @ApiProperty({ description: 'Document updated at' })
        updatedAt: Date;
    }

    // Set a meaningful name for the generated class
    Object.defineProperty(ApiHydratedDocument, 'name', {
        value: `ApiHydrated_${BaseClass.name}`,
    });

    return ApiHydratedDocument;
}

/**
 * Type helper to get the instance type of an ApiHydrated class
 *
 * @example
 * ```typescript
 * type AdminWithMetadata = ApiHydratedType<typeof ApiHydratedAdmin>;
 * ```
 */
export type ApiHydratedType<T> = T extends (...args: any[]) => infer R ? R : never;
