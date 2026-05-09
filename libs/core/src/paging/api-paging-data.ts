import { Transform, type TransformFnParams } from 'class-transformer';

export interface PaginationData {
  hasMore: boolean;
  totalCount?: number;
  /** Cursor value for the last record (for next page) */
  after?: string;
  /** Cursor value for the first record (for previous page) */
  before?: string;
}

/**
 * Standard API response wrapper for paginated lists.
 *
 * Usage:
 *   return new APIPagingData(items, { hasMore: items.length === limit, after: lastId });
 */
export class APIPagingData<T> {
  @Transform((_params: TransformFnParams) => undefined, { toPlainOnly: true })
  data!: T[];

  metadata!: PaginationData;

  constructor(data: T[], metadata: PaginationData) {
    this.data = data;
    this.metadata = metadata;
  }
}
