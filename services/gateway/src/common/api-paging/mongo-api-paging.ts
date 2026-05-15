import { camelCase } from 'lodash';
import { APIPagingDto } from './api-paging.dto';
import { ClientSession, PopulateOptions, Types } from 'mongoose';
import { CursorDirection, PagingConstraint, Sort } from './find-and-count-all.interface';
import { BadRequestException, HttpException } from '@nestjs/common';
import { Utils } from '@core/helpers';

const BAD_FILTER_ERROR = "Incorrect format for 'filter' parameter.";
const DEFAULT_REF_SUFFIX = 'Ref';
const MAXIMUM_DEPTH = 2;
const ACCEPT_DEPTH_PATH = []
const DEFAULT_DYNAMIC_REF_PATHS = []
const FILTER_MODEL_PATHS = []
const DEFAULT_EXCLUDE_EXPAND = []


export interface MongoAPIPagingOptions {
    idPrefix?: string;
    refSuffix?: string;
    refs?: string[];
}

export interface MongoAPIQueryOptions {
    conditions?: any;
    expand?: string | string[] | PopulateOptions | PopulateOptions[],
    excludeExpand?: string[],
    expandPathPrefix?: string,
    populate?: PopulateOptions[],
    failSilently?: boolean,
    select?: string | string[],
    sort?: string,
    session?: ClientSession,
    safe?: boolean | string,
    safeException?: HttpException,
    notFoundException?: HttpException,
}

/**
 * APIPaging prefers using (_id > lastId) for skipping as .skip() is slower over large sets
 */
export class MongoAPIPaging {
    static LIMIT_DEFAULT = 20;
    static DEFAULT_PAGE = 0;
    static SORT_DEFAULT: Sort = { _id: -1 };

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
    static getPagingConstraints(
        query: APIPagingDto,
        defaultConditions = {},
        excludeExpand?: string[],
        populateWithModel?: PopulateOptions[],
        options?: MongoAPIPagingOptions,
    ): PagingConstraint {

        const select = this.parseSpaceSeparated(query.select);
        const limit = query.limit ? query.limit : MongoAPIPaging.LIMIT_DEFAULT;
        let sort = this.parseSort(query.sort);
        const reverseList = query.after ? true : false;
        const populate = this.parseExpand(query.expand, excludeExpand, populateWithModel, options);

        let conditions = {
            ...defaultConditions,
            ...this.parseFilter(query.filter),
            ...this.parseOr(query.or),
            ...this.parseNor(query.nor),
            ...this.parseAnd(query.and),
        };

        if (query.before) {
            conditions = MongoAPIPaging.withLastIdCondition(conditions, query.before, CursorDirection.Backward);
        }

        if (query.after) {
            conditions = MongoAPIPaging.withLastIdCondition(conditions, query.after, CursorDirection.Forward);
            sort = this.invertSort(sort);
        }

        return { select, conditions, limit, sort, reverseList, populate };
    }

    /*
    **
     * Get expand constraints for findAndPopulate function
     *
     * @param conditions
     * @param {APIPagingDto} query
     * @return {PopulateOptions[]}
     */
    static getExpandConstraints(
        expand: string | string[],
        excludeExpand?: string | string[],
        populateWithModel?: PopulateOptions[],
        expandPathPrefix?: string,
    ): PopulateOptions[] {
        return this.parseExpand(expand, excludeExpand, populateWithModel, { idPrefix: expandPathPrefix });
    }

    /**
     * Parse a select string (or array) into the form mongoose's .find()/.findOne()
     * accepts. Pass-through for arrays/falsy values.
     */
    static parseSelect(
        select?: string | string[],
        _options?: MongoAPIPagingOptions,
    ): string | string[] | undefined {
        if (!select) return undefined;
        if (Array.isArray(select)) return select.join(' ');
        return select;
    }

    static parseSpaceSeparated(v: string | string[] = []): string[] {
        if (typeof v === 'string') {
            return v.split(' ').map((item) => item.trim());
        }

        if (Array.isArray(v)) {
            return v.map((item) => item.split(' ')).flat().map((item) => item.trim());
        }

        return [];
    }


    static addRefPaths(str: string | string[], options: MongoAPIPagingOptions) {
        const refSuffix = options?.refSuffix ?? DEFAULT_REF_SUFFIX;
        const refPaths = options?.refs ?? DEFAULT_DYNAMIC_REF_PATHS;

        const arr = MongoAPIPaging.parseSpaceSeparated(str);
        const newArr = [].concat(arr);


        for (const val of arr) {
            refPaths.forEach(ref => {
                if (val.includes(ref) && val.charAt(0) !== '-') {
                    const refKey = val.replace(ref, ref + refSuffix);
                    newArr.push(refKey);
                }
            });
        }

        return newArr;
    }

    static parseSort(sort: string, _conditions?: any): Sort {
        if (!sort) {
            return this.SORT_DEFAULT;
        }

        const sortArr = this.parseSpaceSeparated(sort)
            .map((item) => this.parseSortItem(item));

        return sortArr.reduce((prev, curr) => ({ ...prev, ...curr }), {});
    }

    private static parseSortItem(item: string): Sort {
        const char = item.charAt(0);

        if (char === '-') {
            const key = item.slice(1);
            return { [key]: -1 };
        }
        return { [item]: 1 };
    }

    private static invertSort(sort: Sort): Sort {
        const entries = Object.entries(sort).map(([key, value]) => ([key, value * -1]));
        return Object.fromEntries(entries);
    }

    private static parseExpand(
        expand: string | string[] = [],
        excludeExpand: string | string[] = [],
        populateWithModel: PopulateOptions[] = [],
        options?: MongoAPIPagingOptions,
    ) {

        expand = this.parseSpaceSeparated(expand);
        expand = this.addRefPaths(expand, options);
        excludeExpand = this.parseSpaceSeparated(excludeExpand);
        excludeExpand = excludeExpand.concat(DEFAULT_EXCLUDE_EXPAND);

        // exclude values from excludeExpand
        expand = expand.filter(x => !excludeExpand.includes(x.split(':')[0]));

        const entries = this.parseExpandEntries(expand);

        entries.forEach(x => {
            const option = populateWithModel.find(y => y.path === x.path);
            if (option) {
                x.model = option.model;
            }
        });
        return entries;
    }

    private static parseExpandEntries(entries: string[]) {
        const populateArr = [];

        // remove duplicates and limit depth
        entries = [...new Set(entries)];
        entries = entries.map(x => {
            const deptSplit = x.split('.')
            if (deptSplit.length <= MAXIMUM_DEPTH || ACCEPT_DEPTH_PATH.includes(x)) {
                return x;
            }
            else {
                return deptSplit.slice(0, MAXIMUM_DEPTH).join('.');
            }
        });

        function buildPopulate(path: string, select: string[]) {
            let obj;

            if (path.includes('.')) {
                const split = path.split('.');
                const shiftedPath = split.shift();
                obj = { path: shiftedPath, strictPopulate: false };

                if (split.length > 0) {
                    obj['populate'] = buildPopulate(split.join('.'), select);
                }

                return obj;
            } else {
                return { path, select, strictPopulate: false };
            }
        }

        function mergeSelect(x, y) {
            if (x && y) {
                const xSelect = x.select || [];
                const ySelect = y.select || [];
                return Array.from(new Set(xSelect.concat(ySelect)));
            }
            return undefined;
        }

        for (const val of entries) {
            const split = val.split(':');

            const builtPopulate = buildPopulate(split[0], split[1]?.split(','));
            const mergeIdx = populateArr.findIndex((v) => v.path === builtPopulate.path);

            if (mergeIdx > -1) {
                const mergedSelect = mergeSelect(populateArr[mergeIdx], builtPopulate);
                const mergedPopulate = Array.isArray(populateArr[mergeIdx].populate)
                    ? populateArr[mergeIdx].populate.concat([builtPopulate.populate])
                    : [populateArr[mergeIdx].populate, builtPopulate.populate]

                populateArr[mergeIdx] = {
                    ...populateArr[mergeIdx],
                    select: mergedSelect.filter(x => x),
                    strictPopulate: false,
                    populate: mergedPopulate.filter(x => x),
                };
            } else {
                populateArr.push(builtPopulate);
            }
        }


        return populateArr;
    }

    /**
     * Returns conditions with support for paging
     * @param conditions
     * @param lastId
     * @return {{} & any & {_id: {$gt: *}}}
     */
    static withLastIdCondition(conditions, lastId: string, direction: CursorDirection) {
        const lastIdCondition = direction === CursorDirection.Forward ?
            { $gt: new Types.ObjectId(lastId) } :
            { $lt: new Types.ObjectId(lastId) };

        return Object.assign({}, conditions, { _id: lastIdCondition });
    }

    private static parseFilter(filter: string | string[] = []) {
        let where;

        filter = this.parseSpaceSeparated(filter);

        try {
            where = this.parseFilterEntries(filter);
        } catch (e) {
            throw new BadRequestException(BAD_FILTER_ERROR);
        }

        where = this.parseIdTags(where);
        return where;
    }

    private static parseIdTags(where: Record<string, any>) {
        const entries = Object.entries(where);
        const newEntries = entries.map(([key, value]) => {
            if (FILTER_MODEL_PATHS.includes(key)) {
                value = Utils.parseIdTag(value) ?? value;
                return [key, value];
            }
            return [key, value];
        });

        return Object.fromEntries(newEntries);
    }

    private static parseOr(filter: string | string[]): Record<string, any[]> {
        const filterObj = this.parseFilter(filter);

        if (filterObj) {
            const arr = Object.entries(filterObj).map((v) => ({ [v[0]]: v[1] }));
            if (arr.length > 0) {
                return { $or: arr };
            }
        }
        return {};
    }

    private static parseNor(filter: string | string[]): Record<string, any[]> {
        const filterObj = this.parseFilter(filter);

        if (filterObj) {
            const arr = Object.entries(filterObj).map((v) => ({ [v[0]]: v[1] }));
            if (arr.length > 0) {
                return { $nor: arr };
            }
        }
        return {};
    }

    private static parseAnd(filter: string | string[]): Record<string, any[]> {
        const filterObj = this.parseFilter(filter);

        if (filterObj) {
            const arr = Object.entries(filterObj).map((v) => ({ [v[0]]: v[1] }));
            if (arr.length > 0) {
                return { $and: arr };
            }
        }
        return {};
    }

    private static parseFilterEntries(entries: string[]) {
        const filterEntries = entries
            .map((val) => {
                const split = val.split('|');
                if (split.length == 3) {
                    return { field: split[0], condition: split[1], value: split[2] };
                }
                else if (split.length == 1) {
                    const semiColonSplit = val.split(':');
                    if (semiColonSplit.length == 2) {
                        if (val.charAt(0) == '-') {
                            return { field: semiColonSplit[0].slice(1), condition: 'ne', value: semiColonSplit[1] };
                        }
                        return { field: semiColonSplit[0], condition: 'eq', value: semiColonSplit[1] };
                    }

                }
            })
            .filter((v) => v.value !== undefined);

        return filterEntries.reduce((obj, entry) => {
            const whereValue = this.genWhere(entry.condition, entry.value);

            if (whereValue) {
                if (obj[entry.field] && Utils.isObject(whereValue) && !(whereValue instanceof RegExp)) {
                    obj[entry.field] = { ...obj[entry.field], ...whereValue };
                } else {
                    obj[entry.field] = whereValue;
                }
            }

            return obj;
        }, {});
    }

    private static genWhere(condition: string, value: string) {
        const methodName = camelCase(`gen-${condition}-where`);

        if (typeof this[methodName] === 'function') {
            return this[methodName](value);
        }
    }

    private static genAllWhere(value: string) {
        const values = value.split(',');
        return { $all: [...values] };
    }

    private static genInWhere(value: string) {
        const values = value.split(',');
        return { $in: [...values] };
    }

    private static genNinWhere(value: string) {
        const values = value.split(',');
        return { $nin: [...values] };
    }

    private static genEqWhere(value) {
        return value;
    }

    private static genNeWhere(value) {
        return { $ne: value };
    }

    private static genNotWhere(value) {
        return { $not: { $eq: value } };
    }

    private static genLikeWhere(value) {
        return new RegExp(value, 'i');
    }

    private static genLtWhere(value) {
        return this.genLessThanWhere(value);
    }

    private static genLteWhere(value) {
        return this.genLessThanOrEqualWhere(value);
    }

    private static genLtdWhere(value) {
        return this.genLessThanDateWhere(value);
    }

    private static genLtedWhere(value) {
        return this.genLessThanOrEqualDateWhere(value);
    }

    private static genLessThanWhere(value) {
        return { $lt: value };
    }

    private static genLessThanDateWhere(value) {
        return { $lt: new Date(value) };
    }

    private static genLessThanOrEqualWhere(value) {
        return { $lte: value };
    }

    private static genLessThanOrEqualDateWhere(value) {
        return { $lte: new Date(value) };
    }

    private static genGtWhere(value) {
        return this.genGreaterThanWhere(value);
    }

    private static genGtdWhere(value) {
        return this.genGreaterThanDateWhere(value);
    }

    private static genGteWhere(value) {
        return this.genGreaterThanOrEqualWhere(value);
    }

    private static genGtedWhere(value) {
        return this.genGreaterThanOrEqualDateWhere(value);
    }

    private static genGreaterThanWhere(value) {
        return { $gt: value };
    }

    private static genGreaterThanDateWhere(value) {
        return { $gt: new Date(value) };
    }

    private static genGreaterThanOrEqualWhere(value) {
        return { $gte: value };
    }
    private static genGreaterThanOrEqualDateWhere(value) {
        return { $gte: new Date(value) };
    }
}
