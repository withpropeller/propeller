export interface OrderBy {
    [field: string]: 'ASC' | 'DESC';
}

export enum CursorDirection { 
    Forward = 1,
    Backward = -1 
}

export interface Sort {
    [field: string]: 1 | -1;
}

export interface PagingConstraint {
    select: string | string[];
    sort: Sort;
    limit: number;
    skip?: number;
    populate?: any;
    conditions: any;
    reverseList: boolean;
}

export interface RedisPagingConstraint {
    sort: string[];
    limit: any[];
}

export type FindAndCountAll<T> = (params: {
    limit: number;
    offset: number;
    order: OrderBy;
    relations: string[];
    relationsCount: string[];
    where: any;
    groupBy: string;
}) => Promise<[T[], number]>;
