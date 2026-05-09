import { Transform, TransformFnParams } from 'class-transformer';

export interface PaginationData {
    hasMore: boolean;
    totalCount?: number;
}

export class APIPagingData<T> {
    @Transform((params: TransformFnParams) => params, { toPlainOnly: true })
    data: T[];

    metadata: PaginationData;
}
