import { ApiProperty } from '@nestjs/swagger';

export function ApiHydrated<T extends new (...args: any[]) => any>(BaseClass: T) {
    class ApiHydratedDocument extends BaseClass {
        @ApiProperty({ description: 'Document id' })
        id: string;

        @ApiProperty({ description: 'Document created at' })
        createdAt: Date;

        @ApiProperty({ description: 'Document updated at' })
        updatedAt: Date;
    }

    Object.defineProperty(ApiHydratedDocument, 'name', {
        value: `ApiHydrated_${BaseClass.name}`,
    });

    return ApiHydratedDocument;
}
