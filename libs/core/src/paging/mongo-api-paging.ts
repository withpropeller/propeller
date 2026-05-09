import type { PopulateOptions, SortOrder } from 'mongoose';
import type { APIPagingDto } from './api-paging.dto.js';
import { AppStatus } from '../helpers/enums.js';
import { CustomException } from '../exceptions/custom-exception.js';

// ── Types ──

export interface Sort {
  [field: string]: SortOrder;
}

export interface PagingConstraint {
  conditions: Record<string, unknown>;
  select: string | string[] | Record<string, number>;
  sort: Sort;
  limit: number;
  skip?: number;
  populate?: PopulateOptions[];
}

export interface MongoAPIPagingOptions {
  /** Prefix for tagged IDs (unused if not using tag system) */
  idPrefix?: string;
  /** Suffix for reference auto-expansion (default 'Ref') */
  refSuffix?: string;
  /** Explicit ref paths to expand */
  refs?: string[];
  /** Default sort when none specified */
  defaultSort?: Sort;
  /** Default limit when none specified */
  defaultLimit?: number;
  /** Max limit (prevents abuse) */
  maxLimit?: number;
}

export interface MongoAPIQueryOptions {
  conditions?: Record<string, unknown>;
  expand?: string | string[] | PopulateOptions | PopulateOptions[];
  excludeExpand?: string[];
  populate?: PopulateOptions[];
  failSilently?: boolean;
  select?: string | string[];
  sort?: string;
  safe?: boolean | string;
  safeException?: CustomException;
  notFoundException?: CustomException;
}

// ── Constants ──

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_SORT: Sort = { createdAt: -1 };
const BAD_FILTER_ERROR = "Incorrect format for 'filter' parameter.";

// ── Filter parser ──

interface WhereEntry {
  field: string;
  operator: string;
  value: string | number | boolean;
}

const MONGO_OPS: Record<string, string> = {
  eq: '$eq',
  ne: '$ne',
  gt: '$gt',
  gte: '$gte',
  lt: '$lt',
  lte: '$lte',
  in: '$in',
  nin: '$nin',
  like: '$regex',
  exists: '$exists',
};

function parseWhereEntry(raw: string): WhereEntry {
  const parts = raw.split('|');
  if (parts.length < 3) throw new CustomException(null, AppStatus.BadRequest, 400, BAD_FILTER_ERROR);

  const field = parts[0]!;
  const operator = parts[1]!;
  let value: string | number | boolean = parts.slice(2).join('|');

  // Try number conversion
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') value = num;
  // Try boolean
  if (value === 'true') value = true;
  if (value === 'false') value = false;

  return { field, operator, value };
}

function buildFilter(
  rawFilter: string | string[] | undefined,
): Record<string, unknown> {
  if (!rawFilter) return {};
  const entries = Array.isArray(rawFilter) ? rawFilter : [rawFilter];
  const conditions: Record<string, unknown> = {};

  for (const entry of entries) {
    const { field, operator, value } = parseWhereEntry(entry);
    const mongoOp = MONGO_OPS[operator];
    if (!mongoOp) throw new CustomException(null, AppStatus.BadRequest, 400, BAD_FILTER_ERROR);

    if (mongoOp === '$regex') {
      conditions[field] = { $regex: value, $options: 'i' };
    } else if (mongoOp === '$in' || mongoOp === '$nin') {
      conditions[field] = { [mongoOp]: String(value).split(',').map((v) => v.trim()) };
    } else {
      conditions[field] = { [mongoOp]: value };
    }
  }

  return conditions;
}

function parseSort(rawSort: string | undefined, opts: MongoAPIPagingOptions = {}): Sort {
  if (!rawSort) return opts.defaultSort ?? DEFAULT_SORT;
  const sort: Sort = {};
  for (const field of rawSort.split(',')) {
    const trimmed = field.trim();
    if (trimmed.startsWith('-')) {
      sort[trimmed.slice(1)] = -1;
    } else {
      sort[trimmed] = 1;
    }
  }
  return sort;
}

function parseSelect(rawSelect: string | string[] | undefined, _opts?: MongoAPIPagingOptions): string {
  if (!rawSelect) return '';
  const fields = Array.isArray(rawSelect) ? rawSelect.join(' ') : rawSelect;
  return fields.split(/\s+/).filter(Boolean).join(' ');
}

function parseExpand(
  rawExpand: string | string[] | undefined,
  _excludeExpand?: string[],
): PopulateOptions[] | undefined {
  if (!rawExpand) return undefined;
  const fields = Array.isArray(rawExpand) ? rawExpand : [rawExpand];
  return fields.map((f) => {
    // Support nested via dot: 'business.owner'
    const parts = f.split('.');
    return { path: parts[0]!, select: parts.slice(1).join('.') || undefined };
  });
}

// ── Public API ──

export class MongoAPIPaging {
  /**
   * Parse an APIPagingDto into a PagingConstraint suitable for mongoose queries.
   */
  static toConstraint(dto: APIPagingDto, opts: MongoAPIPagingOptions = {}): PagingConstraint {
    const limit = Math.min(
      dto.limit ?? opts.defaultLimit ?? DEFAULT_LIMIT,
      opts.maxLimit ?? MAX_LIMIT,
    );
    const sort = parseSort(dto.sort, opts);
    const conditions = buildFilter(dto.filter);
    const select = parseSelect(dto.select, opts);
    const populate = parseExpand(dto.expand);

    // Cursor-based pagination
    if (dto.after) {
      conditions['_id'] = { ...(conditions['_id'] as Record<string, unknown> ?? {}), $gt: dto.after };
    }
    if (dto.before) {
      conditions['_id'] = { ...(conditions['_id'] as Record<string, unknown> ?? {}), $lt: dto.before };
    }

    return { conditions, select, sort, limit, populate };
  }

  /** Parse expand for use with populate(). */
  static getExpandConstraints(
    expand: string | string[] | PopulateOptions | PopulateOptions[] | undefined,
    excludeExpand?: string[],
    _extraPopulates?: PopulateOptions[],
  ): PopulateOptions[] | undefined {
    if (!expand) return undefined;
    if (Array.isArray(expand) && expand.length > 0 && typeof expand[0] === 'object') {
      return expand as PopulateOptions[];
    }
    return parseExpand(expand as string | string[], excludeExpand);
  }

  /** Parse select string. */
  static parseSelect(rawSelect: string | string[] | undefined, opts?: MongoAPIPagingOptions): string {
    return parseSelect(rawSelect, opts);
  }

  /** Parse sort string. */
  static parseSort(rawSort: string | undefined, opts?: MongoAPIPagingOptions): Sort {
    return parseSort(rawSort, opts);
  }

  /** Build filter conditions from query string. */
  static buildFilter(rawFilter: string | string[] | undefined): Record<string, unknown> {
    return buildFilter(rawFilter);
  }
}
