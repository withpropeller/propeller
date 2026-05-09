import { isObjectIdOrHexString, type SchemaOptions, Types } from 'mongoose';
import { isEnum } from 'class-validator';
import { Utils } from '../helpers/utils.js';
import { CryptoUtils } from '../crypto/utils.js';
import { ModelIdTag } from './mongo.enums.js';

// ── Constants ──

export const MODEL_PREFIX_SEPARATOR = '.';
export const ATLAS_ERROR_CODE = 8000;

// Re-export from constants for convenience
export { MONGO_UNIQUE_CONSTRAINT_CODE } from '../helpers/constants.js';

// ── Schema Options (the one from sym:ModelSchemaOptions) ──

export interface ModelSchemaOptionsOpts {
  objectIds?: string[];
  pick?: string;
  redact?: string[];
  timestamps?: boolean;
  tag?: ModelIdTag;
  collection?: string;
  transform?: (ret: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Drop-in replacement for mongoose SchemaOptions that automatically:
 * - Stringifies ObjectId fields listed in `objectIds`
 * - Supports tagged IDs (e.g. `bz.abc123`) via `tag`
 * - Redacts sensitive fields via `redact`
 * - Picks only listed fields via `pick`
 * - Adds virtual `id` and `object` properties when `tag` is set
 *
 * Usage:
 *   @Schema(ModelSchemaOptions({ objectIds: ['business'], tag: ModelIdTag.BusinessEntity }))
 *   export class BusinessEntity { ... }
 */
export function ModelSchemaOptions(
  optsOrObjectIds?: string[] | ModelSchemaOptionsOpts,
  pick?: string,
  redact?: string[],
  timestamps = true,
  func?: (ret: Record<string, unknown>) => Record<string, unknown>,
): SchemaOptions {
  let opts: ModelSchemaOptionsOpts = { timestamps: true };

  if (Array.isArray(optsOrObjectIds)) {
    opts.objectIds = optsOrObjectIds;
    opts.pick = pick;
    opts.redact = redact;
    opts.timestamps = timestamps;
    opts.transform = func;
  } else {
    opts = { ...opts, ...optsOrObjectIds };
  }

  return {
    toJSON: {
      transform: SchemaTransformOptions(opts),
      virtuals: true,
    },
    timestamps: opts.timestamps,
    collection: opts.collection,
  };
}

export function SchemaTransformOptions(opts: ModelSchemaOptionsOpts) {
  return (_doc: unknown, ret: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, __v, ...rest } = { ...ret };

    let transformed = rest;

    if (Array.isArray(opts.objectIds)) {
      transformed = opts.objectIds.reduce((prev, curr) => {
        const currSplit = curr.split(':');
        const key = currSplit[0]!;
        let tag: string | undefined = currSplit.length > 1 ? currSplit[1] : undefined;
        if (tag && tag.charAt(0) === '#') {
          tag = ModelIdTag[prev[tag.substring(1)] as keyof typeof ModelIdTag];
        }

        if (!prev[key]) return prev;

        let stringed: string | string[];
        if (Array.isArray(prev[key])) {
          stringed = (prev[key] as unknown[]).map((v) =>
            isObjectIdOrHexString(v) ? (v as Types.ObjectId).toString() : v,
          ) as string[];
        } else {
          stringed = isObjectIdOrHexString(prev[key])
            ? (prev[key] as Types.ObjectId).toString()
            : (prev[key] as string);
        }

        if (tag && typeof stringed === 'string') {
          stringed = TagMongoId(tag as ModelIdTag, new Types.ObjectId(stringed));
        }
        if (tag && Array.isArray(stringed)) {
          stringed = stringed.map((v) =>
            typeof v === 'string' ? TagMongoId(tag as ModelIdTag, new Types.ObjectId(v)) : v,
          );
        }

        return { ...prev, [key]: stringed };
      }, transformed);
    }

    if (opts.pick) {
      transformed = Utils.pickKeys(transformed, opts.pick) as Record<string, unknown>;
    }

    if (Array.isArray(opts.redact)) {
      const redactStr = '... ' + opts.redact.map((v) => '*' + v).join(' ');
      transformed = Utils.pickKeys(transformed, redactStr) as Record<string, unknown>;
    }

    if (opts.transform) {
      transformed = opts.transform(transformed);
    }

    if (opts.tag) {
      (transformed as Record<string, unknown>)['id'] = TagMongoId(opts.tag, _id as Types.ObjectId);
      (transformed as Record<string, unknown>)['object'] = GetObjectType(opts.tag);
    }

    return transformed;
  };
}

// ── Tag helpers ──

export function TagMongoId(tag: ModelIdTag, id: Types.ObjectId): string | null {
  if (!id) return null;
  return TagId(tag, CryptoUtils.base58EncodeObjectId(id));
}

export function TagId(tag: ModelIdTag, id: string): string {
  return `${tag}${MODEL_PREFIX_SEPARATOR}${id}`;
}

export function GetObjectType(tag: ModelIdTag): string | null {
  const objectTypeMap: Record<string, string> = {
    [ModelIdTag.Business]: 'business',
    [ModelIdTag.BusinessEntity]: 'business_entity',
    [ModelIdTag.User]: 'user',
    [ModelIdTag.ApiRequest]: 'api_request',
    [ModelIdTag.Webhook]: 'webhook',
    [ModelIdTag.Account]: 'account',
    [ModelIdTag.LedgerEntry]: 'ledger_entry',
    [ModelIdTag.Payment]: 'payment',
    [ModelIdTag.Event]: 'event',
    [ModelIdTag.Configuration]: 'configuration',
    [ModelIdTag.SecretKey]: 'secret_key',
  };
  return objectTypeMap[tag] ?? null;
}

// ── Prop helpers (for @Prop decorators) ──

export function enumProp(o: { [s: string]: string }, defaultValue?: string) {
  return { type: String, enum: Object.values(o), default: defaultValue };
}

export function enumPropRequired(o: { [s: string]: string }) {
  return { type: String, enum: Object.values(o), required: true };
}

export function enumPropArray(o: { [s: string]: string }, defaultValue?: string[]) {
  return { type: [String], enum: Object.values(o), default: defaultValue };
}

export function ensureObjectId(id: string | Types.ObjectId): Types.ObjectId | string {
  return typeof id === 'string' && isObjectIdOrHexString(id) ? new Types.ObjectId(id) : id;
}

export function objectRefPropRequired(ref: string) {
  return { type: Types.ObjectId, ref, required: true };
}

export function objectRefProp(ref: string) {
  return { type: Types.ObjectId, ref };
}

export function objectRefPathPropRequired(refPath: string) {
  return { type: Types.ObjectId, refPath, required: true };
}

export function objectRefPathProp(refPath: string) {
  return { type: Types.ObjectId, refPath };
}

// ── ID parsing helpers ──

export function MongoIdEquals(x: { toString: () => string }, y: { toString: () => string }): boolean {
  return x.toString() === y.toString();
}

export function MongoIdIncludes(arr: { toString: () => string }[], x: { toString: () => string }): boolean {
  return arr.map((v) => v.toString()).includes(x.toString());
}

export interface TagMap {
  tag: ModelIdTag;
  id: Types.ObjectId;
  model: string;
}

export function ParseTagId(str: string, allowedTags?: ModelIdTag[]): Types.ObjectId | null {
  if (typeof str === 'string') {
    const splitted = str.split(MODEL_PREFIX_SEPARATOR);
    if (splitted.length === 1 && Types.ObjectId.isValid(splitted[0]!)) {
      return new Types.ObjectId(splitted[0]!);
    }
    const tag = splitted.slice(0, -1).join(MODEL_PREFIX_SEPARATOR);
    const encodedId = str.split(MODEL_PREFIX_SEPARATOR).slice(-1)[0]!;

    const id = CryptoUtils.base58DecodeObjectId(encodedId);
    if (Array.isArray(allowedTags) && allowedTags.includes(tag as ModelIdTag) && id) return id;
    if (!Array.isArray(allowedTags) && isEnum(tag, ModelIdTag) && id) return id;
  }
  return null;
}

export function ParseArrTagId(str: string[], allowedTags?: ModelIdTag[]): Types.ObjectId[] {
  if (Array.isArray(str)) return str.map((s) => ParseTagId(s, allowedTags)).filter((id): id is Types.ObjectId => id !== null);
  return [];
}

export function ParseTagMap(str: string, allowedTags?: ModelIdTag[]): TagMap | null {
  if (!str) return null;
  const tag = str.split(MODEL_PREFIX_SEPARATOR).slice(0, -1).join(MODEL_PREFIX_SEPARATOR);
  const encodedId = str.split(MODEL_PREFIX_SEPARATOR).slice(-1)[0]!;
  const id = CryptoUtils.base58DecodeObjectId(encodedId);

  if (Array.isArray(allowedTags) && allowedTags.includes(tag as ModelIdTag) && Types.ObjectId.isValid(id)) {
    return { tag: tag as ModelIdTag, id: id!, model: GetModelForTag(tag as ModelIdTag) };
  }
  if (!Array.isArray(allowedTags) && isEnum(tag, ModelIdTag) && Types.ObjectId.isValid(id)) {
    return { tag: tag as ModelIdTag, id: id!, model: GetModelForTag(tag as ModelIdTag) };
  }
  return null;
}

export function ParseArrTagMap(str: string[], allowedTags?: ModelIdTag[]): TagMap[] {
  return str.map((s) => ParseTagMap(s, allowedTags)).filter((m): m is TagMap => m !== null);
}

export function GetModelForTag(tag: ModelIdTag): string {
  const tagModelMap: Record<string, string> = {
    [ModelIdTag.Business]: 'Business',
    [ModelIdTag.BusinessEntity]: 'BusinessEntity',
    [ModelIdTag.User]: 'User',
    [ModelIdTag.ApiRequest]: 'ApiRequest',
    [ModelIdTag.Webhook]: 'Webhook',
    [ModelIdTag.Account]: 'Account',
    [ModelIdTag.LedgerEntry]: 'LedgerEntry',
    [ModelIdTag.Payment]: 'Payment',
    [ModelIdTag.Event]: 'Event',
    [ModelIdTag.Configuration]: 'Configuration',
    [ModelIdTag.SecretKey]: 'SecretKey',
  };
  return tagModelMap[tag] ?? 'Unknown';
}

export function GetModelTag(model: string): ModelIdTag | null {
  const modelTagMap: Record<string, ModelIdTag> = {
    Business: ModelIdTag.Business,
    BusinessEntity: ModelIdTag.BusinessEntity,
    User: ModelIdTag.User,
    ApiRequest: ModelIdTag.ApiRequest,
    Webhook: ModelIdTag.Webhook,
    Account: ModelIdTag.Account,
    LedgerEntry: ModelIdTag.LedgerEntry,
    Payment: ModelIdTag.Payment,
    Event: ModelIdTag.Event,
    Request: ModelIdTag.Request,
    Configuration: ModelIdTag.Configuration,
    SecretKey: ModelIdTag.SecretKey,
  };
  return modelTagMap[model] ?? null;
}
