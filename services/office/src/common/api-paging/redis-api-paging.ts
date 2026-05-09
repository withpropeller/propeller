import { isNil } from 'lodash';
import { APIPagingDto } from './api-paging.dto';
import { RedisPagingConstraint } from './find-and-count-all.interface';
import { MongoAPIPaging } from './mongo-api-paging';

/**
 * APIPaging prefers using (_id > lastId) for skipping as .skip() is slower over large sets
 */
export class RedisAPIPaging {
    static LIMIT_DEFAULT = 20;
    static DEFAULT_PAGE = 0;
    static SORT_DEFAULT: string[] = [];

    /**
     * Returns conditions with support for paging
     * @param conditions
     * @param lastId
     * @return {{} & any & {_id: {$gt: *}}}
     */
    static withPagingCondition(conditions, lastId) {
        return lastId ? Object.assign({}, conditions, { _id: { $gt: lastId } }) : conditions;
    }

    /**
     * Returns all constraints for paging
     *
     * @param conditions
     * @param {APIPagingDto} query
     * @return {{conditions: {} & any & {_id: {$gt: *}}; limit: number; sort: number}}
     */
    static getPagingConstraints(query: APIPagingDto): RedisPagingConstraint {
        const limit = this.parseLimit(query);
        const sort = this.parseSort(query.sort);

        return { limit, sort };
    }

    private static parseLimit(query: APIPagingDto): any[] {
        const limit = query.limit ? query.limit : MongoAPIPaging.LIMIT_DEFAULT;
        const skip = 0;

        return ['LIMIT', skip, limit];
    }

    private static parseSort(sort: string): string[] {
        if (!sort) {
            return this.SORT_DEFAULT;
        }

        const sortArr = sort.split(',').map((item) => this.parseSortItem(item));
        return sortArr.flat();
    }

    private static parseSortItem(item: string): string[] {
        const char = item.charAt(0);

        if (char === '-') {
            const key = item.slice(1);
            return ['SORTBY', key, 'DESC'];
        }
        return ['SORTBY', item, 'ASC'];
    }

    static calcSkip(limit: number, page: number) {
        const withPage = isNil(page) || page <= 0 ? this.DEFAULT_PAGE : page;
        const withLimit = isNil(limit) || limit <= 0 ? this.LIMIT_DEFAULT : limit;
        return withLimit * withPage;
    }
}
