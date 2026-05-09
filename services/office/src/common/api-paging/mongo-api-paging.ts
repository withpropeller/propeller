import { camelCase } from 'lodash';
import { APIPagingDto } from './api-paging.dto';
import { PopulateOptions, SessionOption, Types } from 'mongoose';
import { CursorDirection, PagingConstraint, Sort } from './find-and-count-all.interface';
import { Utils } from '@core/helpers';
import { AppException } from '@core/exceptions';
import { ParseArrTagId, ParseTagId } from '@core/mongo';

const BAD_FILTER_ERROR = "Incorrect format for 'filter' parameter.";
const DEFAULT_REF_SUFFIX = 'Ref';
const SELECT_MAXIMUM_DEPTH = 1;
const EXPAND_MAXIMUM_DEPTH = 2;
const EXPAND_ACCEPT_DEPTH_PATH = [];
const EXPAND_EXCLUDES_SPLIT_PATH = [
    'authorization.webhook',
    'authorization.settlementAccount',
    'timeline.user',
    'timeline.customer',
];
const SELECT_ACCEPT_DEPTH_PATH = [
    'authorization.webhook',
    'authorization.settlementAccount',
    'timeline.user',
    'timeline.customer',
];
const DEFAULT_DYNAMIC_REF_PATHS = ['consumer', 'source', 'actor'];
const FILTER_MODEL_PATHS = [
    'id',
    'business',
    'consumer',
    'source',
    'actor',
    'customer',
    'card',
    'account',
    'program',
    'event',
];
const DEFAULT_EXCLUDE_EXPAND = ['id'];

interface WhereEntry {
    condition: string;
    field: string;
    value: string | number;
}

export interface MongoAPIPagingOptions {
    idPrefix?: string;
    refSuffix?: string;
    refs?: string[];
    searchFields?: string[];
}

export interface MongoAPIQueryOptions extends SessionOption {
    conditions?: any;
    expand?: string | string[] | PopulateOptions | PopulateOptions[];
    excludeExpand?: string[];
    populate?: PopulateOptions[];
    failSilently?: boolean;
    select?: string | string[];
    sort?: string;
    safe?: boolean | string;
    safeException?: AppException;
    limit?: number;
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
        const select = this.parseSelect(query.select, options);
        const limit = query.limit ? query.limit : MongoAPIPaging.LIMIT_DEFAULT;
        let sort = this.parseSort(query.sort);
        const reverseList = query.after ? true : false;
        const populate = this.parseExpand(query.expand, excludeExpand, populateWithModel);

        let conditions = {
            ...defaultConditions,
            ...this.parseFilter(query.filter),
            ...this.parseOr(query.or),
            ...this.parseNor(query.nor),
            ...this.parseAnd(query.and),
            ...this.parseSearch(query.search, options),
        };

        if (query.before) {
            conditions = MongoAPIPaging.withLastIdCondition(conditions, query.before, CursorDirection.Backward);
        }

        if (query.after) {
            conditions = MongoAPIPaging.withLastIdCondition(conditions, query.after, CursorDirection.Forward);
            sort = this.invertSort(sort);
        }

        return { select, conditions, limit, sort, populate, reverseList };
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
    ): PopulateOptions[] {
        return this.parseExpand(expand, excludeExpand, populateWithModel);
    }

    static parseSpaceSeparated(v: string | string[] = []): string[] {
        if (typeof v === 'string') {
            return v.split(' ').map((item) => item.trim());
        }

        if (Array.isArray(v)) {
            return v
                .map((item) => item.split(' '))
                .flat()
                .map((item) => item.trim());
        }

        return [];
    }

    static parseSelect(str: string | string[] = [], options: MongoAPIPagingOptions) {
        let entries = this.parseSpaceSeparated(str);

        // remove duplicates and limit depth
        entries = [...new Set(entries)];
        entries = entries.map((x) => {
            const deptSplit = x.split('.');
            if (deptSplit.length <= SELECT_MAXIMUM_DEPTH || SELECT_ACCEPT_DEPTH_PATH.includes(x)) {
                return x;
            } else {
                return deptSplit.slice(0, SELECT_MAXIMUM_DEPTH).join('.');
            }
        });

        return this.addRefPaths(entries, options);
    }

    static addRefPaths(str: string | string[], options: MongoAPIPagingOptions) {
        const refSuffix = options?.refSuffix ?? DEFAULT_REF_SUFFIX;
        const refPaths = options?.refs ?? DEFAULT_DYNAMIC_REF_PATHS;

        const arr = MongoAPIPaging.parseSpaceSeparated(str);
        const newArr = [].concat(arr);

        for (const val of arr) {
            refPaths.forEach((ref) => {
                if (val.includes(ref) && val.charAt(0) !== '-') {
                    const refKey = val.replace(ref, ref + refSuffix);
                    newArr.push(refKey);
                }
            });
        }

        return newArr;
    }

    static parseSort(sort: string): Sort {
        if (!sort) {
            return this.SORT_DEFAULT;
        }

        const sortArr = this.parseSpaceSeparated(sort).map((item) => this.parseSortItem(item));

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
        const entries = Object.entries(sort).map(([key, value]) => [key, value * -1]);
        return Object.fromEntries(entries);
    }

    static parseExpand(
        expand: string | string[] = [],
        excludeExpand: string | string[] = [],
        populateWithModel: PopulateOptions[] = [],
    ) {
        expand = this.parseSpaceSeparated(expand);
        excludeExpand = this.parseSpaceSeparated(excludeExpand);
        excludeExpand = excludeExpand.concat(DEFAULT_EXCLUDE_EXPAND);

        // exclude values from excludeExpand
        expand = expand.filter((x) => !excludeExpand.includes(x.split(':')[0]));

        const entries = this.parseExpandEntries(expand);

        entries.forEach((x) => {
            const option = populateWithModel.find((y) => y.path === x.path);
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
        entries = entries.map((x) => {
            const deptSplit = x.split('.');
            if (deptSplit.length <= EXPAND_MAXIMUM_DEPTH || EXPAND_ACCEPT_DEPTH_PATH.includes(x)) {
                return x;
            } else {
                return deptSplit.slice(0, EXPAND_MAXIMUM_DEPTH).join('.');
            }
        });

        function buildPopulate(path: string, select: string[]) {
            let obj;

            if (path.includes('.') && !EXPAND_EXCLUDES_SPLIT_PATH.includes(path)) {
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
                    : [populateArr[mergeIdx].populate, builtPopulate.populate];

                populateArr[mergeIdx] = {
                    ...populateArr[mergeIdx],
                    select: mergedSelect.filter((x) => x),
                    strictPopulate: false,
                    populate: mergedPopulate.filter((x) => x),
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
        const lastIdCondition =
            direction === CursorDirection.Forward
                ? { $gt: new Types.ObjectId(lastId) }
                : { $lt: new Types.ObjectId(lastId) };

        return Object.assign({}, conditions, { _id: lastIdCondition });
    }

    private static parseFilter(filter: string | string[] = []) {
        let where;

        filter = this.parseFilterStr(filter);

        try {
            where = this.parseFilterEntries(filter);
        } catch (e) {
            throw AppException.BadRequest.setError(e).setMessage(BAD_FILTER_ERROR);
        }

        where = this.parseIdTags(where);
        return where;
    }

    static parseFilterStr(v: string | string[] = []): string[] {
        const filterArr = [];
        const strArr = Array.isArray(v) ? v : [v];

        for (let i = 0; i < strArr.length; i++) {
            let openingBracePos = -1;
            let braceMode = false;
            let quoteMode = false;
            let filterStr = '';

            for (const [index, char] of [...strArr[i]].entries()) {
                if (char === '<' && !braceMode && !quoteMode) {
                    openingBracePos = index;
                    braceMode = true;
                    continue;
                }

                if (char === '"' && !braceMode && !quoteMode) {
                    quoteMode = true;
                    continue;
                }

                if (char === ' ' && !braceMode && !quoteMode) {
                    filterArr.push(filterStr);
                    filterStr = '';
                    continue;
                }

                if (char === '>' && braceMode && !filterStr.endsWith('\\')) {
                    braceMode = false;
                    continue;
                }

                if (char === '"' && quoteMode && !filterStr.endsWith('\\')) {
                    quoteMode = true;
                    continue;
                }

                if (filterStr.endsWith('\\')) {
                    filterStr = filterStr.slice(0, -1);
                }

                filterStr += char;
                if (braceMode && openingBracePos > -1 && index === strArr[i].length - 1) {
                    filterStr = filterStr.slice(0, openingBracePos) + '<' + filterStr.slice(openingBracePos + 1);
                }
            }

            filterArr.push(filterStr);
        }

        return filterArr;
    }

    private static parseIdTags(where: Record<string, any>) {
        const entries = Object.entries(where);
        const newEntries = entries.map(([key, value]) => {
            if (key === '_id' || FILTER_MODEL_PATHS.includes(key)) {
                if (Utils.isObject(value)) {
                    const newEntries = Object.entries(value).map(([k, v]) => {
                        v = Array.isArray(v) ? ParseArrTagId(v) : ParseTagId(v as string) ?? v;
                        if (k === 'id' && Types.ObjectId.isValid(v as any)) {
                            return ['_id', v];
                        }
                        return [k, v];
                    });
                    const resultKey = key === 'id' ? '_id' : key;
                    return [resultKey, Object.fromEntries(newEntries)];
                }
                value = ParseTagId(value) ?? value;
                if (key === 'id' && Types.ObjectId.isValid(value)) {
                    return ['_id', value];
                }
                return [key, value];
            }
            return [key, value];
        });

        return Object.fromEntries(newEntries);
    }

    private static parseOr(filter: string | string[]): Record<string, any[]> {
        const filterObj = this.parseFilter(filter);

        if (filterObj) {
            const arr = Object.entries(filterObj).map((v) => ({
                [v[0]]: v[1],
            }));
            if (arr.length > 0) {
                return { $or: arr };
            }
        }
        return {};
    }

    private static parseNor(filter: string | string[]): Record<string, any[]> {
        const filterObj = this.parseFilter(filter);

        if (filterObj) {
            const arr = Object.entries(filterObj).map((v) => ({
                [v[0]]: v[1],
            }));
            if (arr.length > 0) {
                return { $nor: arr };
            }
        }
        return {};
    }

    private static parseAnd(filter: string | string[]): Record<string, any[]> {
        const filterObj = this.parseFilter(filter);

        if (filterObj) {
            const arr = Object.entries(filterObj).map((v) => ({
                [v[0]]: v[1],
            }));
            if (arr.length > 0) {
                return { $and: arr };
            }
        }
        return {};
    }

    private static parseSearch(search: string, options?: MongoAPIPagingOptions): Record<string, any> {
        if (!search) return {};

        const refPaths = [...FILTER_MODEL_PATHS, ...(options?.refs ?? DEFAULT_DYNAMIC_REF_PATHS)];
        const orConditions = [];

        // Always try _id regardless of whether searchFields are configured
        const parsed = ParseTagId(search);
        if (parsed && Types.ObjectId.isValid(parsed)) {
            orConditions.push({ _id: parsed });
        }

        if (!options?.searchFields?.length) {
            return orConditions.length ? { $and: [{ $or: orConditions }] } : {};
        }

        for (const field of options.searchFields) {
            if (field === '_id' || field === 'id') continue; // already handled above

            // For dotted paths (e.g. 'networkData.card'), check both the full path
            // and the leaf segment against refPaths so nested ObjectId refs are handled correctly
            const leaf = field.includes('.') ? field.split('.').pop() : field;
            const isRef = refPaths.includes(field) || refPaths.includes(leaf);

            if (isRef) {
                if (parsed && Types.ObjectId.isValid(parsed)) {
                    orConditions.push({ [field]: parsed });
                }
            } else {
                // MongoDB dot notation works natively for nested string fields
                orConditions.push({ [field]: new RegExp(search, 'i') });
            }
        }

        if (orConditions.length === 0) return {};

        return { $and: [{ $or: orConditions }] };
    }

    private static parseFilterEntries(entries: string[]) {
        const filterEntries = entries
            .map((val) => {
                const split = val.split('|');
                if (split.length == 3) {
                    return {
                        field: split[0],
                        condition: split[1],
                        value: split[2],
                    };
                } else if (split.length == 1) {
                    return this.parseFilterCondition(val);
                }
            })
            .filter((v) => v.value !== undefined);

        return filterEntries.reduce((obj, entry) => {
            const whereValue = this.genWhere(entry);

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

    private static parseFilterCondition(val: string) {
        // equality string
        const semiColonSplit = val.split(':');
        if (semiColonSplit.length == 2) {
            if (val.charAt(0) == '-') {
                return {
                    field: semiColonSplit[0].slice(1),
                    condition: 'ne',
                    value: semiColonSplit[1],
                };
            }
            return {
                field: semiColonSplit[0],
                condition: 'eq',
                value: semiColonSplit[1],
            };
        }

        // ellipse
        const ellipseSplit = val.split('~');
        if (ellipseSplit.length == 2) {
            if (val.charAt(0) == '-') {
                return {
                    field: ellipseSplit[0].slice(1),
                    condition: 'nlike',
                    value: ellipseSplit[1],
                };
            }
            return {
                field: ellipseSplit[0],
                condition: 'like',
                value: ellipseSplit[1],
            };
        }

        // greater than or equal
        const greaterThanOrEqualSplit = val.split('>=');
        if (greaterThanOrEqualSplit.length == 2) {
            if (val.charAt(0) == '-') {
                return {
                    field: greaterThanOrEqualSplit[0].slice(1),
                    condition: 'lt',
                    value: Utils.safeNumber(greaterThanOrEqualSplit[1]),
                };
            }
            return {
                field: greaterThanOrEqualSplit[0],
                condition: 'gte',
                value: Utils.safeNumber(greaterThanOrEqualSplit[1]),
            };
        }

        // less than or equal
        const lessThanOrEqualSplit = val.split('<=');
        if (lessThanOrEqualSplit.length == 2) {
            if (val.charAt(0) == '-') {
                return {
                    field: lessThanOrEqualSplit[0].slice(1),
                    condition: 'gt',
                    value: Utils.safeNumber(lessThanOrEqualSplit[1]),
                };
            }
            return {
                field: lessThanOrEqualSplit[0],
                condition: 'lte',
                value: Utils.safeNumber(lessThanOrEqualSplit[1]),
            };
        }

        // not equality
        const notEqualitySplit = val.split('!=');
        if (notEqualitySplit.length == 2) {
            if (val.charAt(0) == '-') {
                return {
                    field: notEqualitySplit[0].slice(1),
                    condition: 'eq',
                    value: Utils.safeNumber(notEqualitySplit[1]),
                };
            }
            return {
                field: notEqualitySplit[0],
                condition: 'ne',
                value: Utils.safeNumber(notEqualitySplit[1]),
            };
        }

        // equality
        const equalitySplit = val.split('=');
        if (equalitySplit.length == 2) {
            if (val.charAt(0) == '-') {
                return {
                    field: equalitySplit[0].slice(1),
                    condition: 'ne',
                    value: Utils.safeNumber(equalitySplit[1]),
                };
            }
            return {
                field: equalitySplit[0],
                condition: 'eq',
                value: Utils.safeNumber(equalitySplit[1]),
            };
        }

        // greater than
        const greaterThanSplit = val.split('>');
        if (greaterThanSplit.length == 2) {
            if (val.charAt(0) == '-') {
                return {
                    field: greaterThanSplit[0].slice(1),
                    condition: 'lte',
                    value: Utils.safeNumber(greaterThanSplit[1]),
                };
            }
            return {
                field: greaterThanSplit[0],
                condition: 'gt',
                value: Utils.safeNumber(greaterThanSplit[1]),
            };
        }

        // less than
        const lessThanSplit = val.split('<');
        if (lessThanSplit.length == 2) {
            if (val.charAt(0) == '-') {
                return {
                    field: lessThanSplit[0].slice(1),
                    condition: 'gte',
                    value: lessThanSplit[1],
                };
            }
            return {
                field: lessThanSplit[0],
                condition: 'lt',
                value: Utils.safeNumber(lessThanSplit[1]),
            };
        }
    }

    private static genWhere(entry: WhereEntry) {
        const methodName = camelCase(`gen-${entry.condition}-where`);

        if (typeof this[methodName] === 'function') {
            return this[methodName](entry);
        }
    }

    private static genAllWhere(entry: WhereEntry) {
        if (typeof entry.value == 'string') {
            const values = entry.value.split(',');
            return { $all: [...values] };
        }
        return null;
    }

    private static genInWhere(entry: WhereEntry) {
        if (typeof entry.value == 'string') {
            const values = entry.value.split(',');
            return { $in: [...values] };
        }
        return null;
    }

    private static genNinWhere(entry: WhereEntry) {
        if (typeof entry.value === 'string') {
            const values = entry.value.split(',');
            return { $nin: [...values] };
        }
        return null;
    }

    private static genEqWhere(entry: WhereEntry) {
        return entry.value;
    }

    private static genNeWhere(entry: WhereEntry) {
        return { $ne: entry.value };
    }

    private static genNotWhere(entry: WhereEntry) {
        return { $not: { $eq: entry.value } };
    }

    private static genLikeWhere(entry: WhereEntry) {
        if (FILTER_MODEL_PATHS.includes(entry.field)) {
            return entry.value;
        }
        return typeof entry.value == 'string' ? new RegExp(entry.value, 'i') : null;
    }

    private static genNlikeWhere(entry: WhereEntry) {
        if (FILTER_MODEL_PATHS.includes(entry.field)) {
            return { $not: entry.value };
        }
        return typeof entry.value == 'string' ? { $not: new RegExp(entry.value, 'i') } : null;
    }

    private static genLtWhere(entry: WhereEntry) {
        return this.genLessThanWhere(entry);
    }

    private static genLteWhere(entry: WhereEntry) {
        return this.genLessThanOrEqualWhere(entry);
    }

    private static genLtdWhere(entry: WhereEntry) {
        return this.genLessThanDateWhere(entry);
    }

    private static genLtedWhere(entry: WhereEntry) {
        return this.genLessThanOrEqualDateWhere(entry);
    }

    private static genLessThanWhere(entry: WhereEntry) {
        return { $lt: entry.value };
    }

    private static genLessThanDateWhere(entry: WhereEntry) {
        const d = new Date(entry.value);
        if (isNaN(d.getTime()))
            throw AppException.BadRequest.setMessage(
                `Invalid date value '${entry.value}' for field '${entry.field}'. Use ltd/gtd/lted/gted only with date values.`,
            );
        return { $lt: d };
    }

    private static genLessThanOrEqualWhere(entry: WhereEntry) {
        return { $lte: entry.value };
    }

    private static genLessThanOrEqualDateWhere(entry: WhereEntry) {
        const d = new Date(entry.value);
        if (isNaN(d.getTime()))
            throw AppException.BadRequest.setMessage(
                `Invalid date value '${entry.value}' for field '${entry.field}'. Use ltd/gtd/lted/gted only with date values.`,
            );
        return { $lte: d };
    }

    private static genGtWhere(entry: WhereEntry) {
        return this.genGreaterThanWhere(entry);
    }

    private static genGtdWhere(entry: WhereEntry) {
        return this.genGreaterThanDateWhere(entry);
    }

    private static genGteWhere(entry: WhereEntry) {
        return this.genGreaterThanOrEqualWhere(entry);
    }

    private static genGtedWhere(entry: WhereEntry) {
        return this.genGreaterThanOrEqualDateWhere(entry);
    }

    private static genGreaterThanWhere(entry: WhereEntry) {
        return { $gt: entry.value };
    }

    private static genGreaterThanDateWhere(entry: WhereEntry) {
        const d = new Date(entry.value);
        if (isNaN(d.getTime()))
            throw AppException.BadRequest.setMessage(
                `Invalid date value '${entry.value}' for field '${entry.field}'. Use ltd/gtd/lted/gted only with date values.`,
            );
        return { $gt: d };
    }

    private static genGreaterThanOrEqualWhere(entry: WhereEntry) {
        return { $gte: entry.value };
    }

    private static genGreaterThanOrEqualDateWhere(entry: WhereEntry) {
        const d = new Date(entry.value);
        if (isNaN(d.getTime()))
            throw AppException.BadRequest.setMessage(
                `Invalid date value '${entry.value}' for field '${entry.field}'. Use ltd/gtd/lted/gted only with date values.`,
            );
        return { $gte: d };
    }

    private static genSizeWhere(entry: WhereEntry) {
        const size = Utils.safeNumber(entry.value);
        return size !== null ? { $size: size } : null;
    }

    private static genNsizeWhere(entry: WhereEntry) {
        const size = Utils.safeNumber(entry.value);
        return size !== null ? { $not: { $size: size } } : null;
    }

    private static genExistsWhere(entry: WhereEntry) {
        return { $exists: Utils.safeBoolean(entry.value) };
    }
}
