import { CryptoUtils } from '@core/crypto/utils';
import { Utils } from '@core/helpers';
import { Types, isObjectIdOrHexString, SchemaOptions, HydratedDocument } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelIdTag, ObjectModel } from './mongo.enums';
import { ExecutionOptions } from '@core/interfaces';
import { LedgerMetadata } from './ledger.repository';

export const MODEL_PREFIX_SEPARATOR = '.';
export const MONGO_UNIQUE_CONSTRAINT_CODE = 11000;
export const ATLAS_ERROR_CODE = 8000;

export function SchemaTransformOptions(opts: ModelSchemaOptionsOpts) {
    return (doc, ret) => {
        // eslint-disable-next-line
        let { _id, __v, ...rest } = { ...ret } as any;

        if (Array.isArray(opts.objectIds)) {
            rest = opts.objectIds.reduce((prev, curr) => {
                const currSplit = curr.split(':');
                curr = currSplit[0];
                let tag = currSplit.length > 1 ? currSplit[1] : undefined;
                if (tag && tag.charAt(0) === '#') {
                    tag = ModelIdTag[rest[tag.substring(1)]];
                }

                if (!rest[curr]) {
                    return prev;
                }

                let stringed;
                if (Array.isArray(rest[curr])) {
                    stringed = rest[curr].map((v) => (isObjectIdOrHexString(v) ? v.toString() : v));
                } else {
                    stringed = isObjectIdOrHexString(rest[curr]) ? rest[curr].toString() : rest[curr];
                }

                if (tag && typeof stringed === 'string') {
                    stringed = TagMongoId(tag, stringed);
                }

                if (tag && Array.isArray(stringed)) {
                    stringed = stringed.map((v) => (typeof v == 'string' ? TagMongoId(tag, v) : v));
                }

                return { ...prev, [curr]: stringed };
            }, rest);
        }

        if (opts.pick) {
            rest = Utils.pickKeys(rest, opts.pick);
        }

        if (opts.transform) {
            rest = opts.transform(rest);
        }

        if (opts.tag) {
            rest.id = TagMongoId(opts.tag, rest.id);
            rest.object = GetObjectType(opts.tag);
        }

        return rest;
    };
}

export interface ModelSchemaOptionsOpts {
    objectIds?: string[];
    pick?: string;
    timestamps?: boolean;
    tag?: string;
    collection?: string;
    strict?: boolean;
    transform?: (ret) => any;
}

/**
 * https://wanago.io/2021/08/30/api-nestjs-virtual-properties-mongodb-mongoose/
 *
 * @param spaceSeparatedKeys uses json-pick-keys to exclude keys
 * @param objectIds turns objectIdss automatically to strings
 * @param func additional transform function
 * @returns
 */
export function ModelSchemaOptions(
    optsOrObjectIds?: string[] | ModelSchemaOptionsOpts,
    pick?: string,
    timestamps = true,
    func?: (ret) => any,
): SchemaOptions {
    let opts: ModelSchemaOptionsOpts = { timestamps: true };

    if (Array.isArray(optsOrObjectIds)) {
        opts.objectIds = optsOrObjectIds;
        opts.pick = pick;
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
        strict: opts.strict,
    };
}

export type Stringable = { toString: () => string };

export const MongoIdEquals = (x: Stringable, y: Stringable) => x.toString() === y.toString();

export function MongoIdIncludes(arr: Stringable[], x?: Stringable) {
    if (!x) {
        return false;
    }

    return arr.map((v) => v.toString()).includes(x.toString());
}

export function MongoIdUniqueSet(arr: Types.ObjectId[]) {
    const uniqueArr = Array.from(new Set(arr.map((v) => v.toString())));
    return uniqueArr.map((v) => new Types.ObjectId(v));
}

export function TagId(tag: string, id: string) {
    return `${tag}${MODEL_PREFIX_SEPARATOR}${id}`;
}

export function TagMongoId(tag: string, id: string | Types.ObjectId) {
    if (!id) {
        return null;
    }
    return TagId(tag, CryptoUtils.base58EncodeObjectId(id));
}

export function enumProp(o: { [s: string]: string }, defaultValue?: string) {
    return {
        type: String,
        enum: Object.values(o),
        default: defaultValue,
    };
}

export function enumPropRequired(o: { [s: string]: string }) {
    return {
        type: String,
        enum: Object.values(o),
        required: true,
    };
}

export function enumPropArray(o: { [s: string]: string }, defaultValue?: string[]) {
    return {
        type: [String],
        enum: Object.values(o),
        default: defaultValue,
    };
}

export function enumPropArrayRequired(o: { [s: string]: string }) {
    return {
        type: [String],
        enum: Object.values(o),
        required: true,
    };
}

export function objectIdArrayProp(ref: string, required = false) {
    return {
        type: [
            {
                type: MongooseSchema.Types.ObjectId,
                ref,
            },
        ],
        required,
    };
}

export function ensureObjectId(id: string | Types.ObjectId) {
    return typeof id === 'string' && isObjectIdOrHexString(id) ? new Types.ObjectId(id) : id;
}

export function GetObjectType(tag: string) {
    if (!tag) {
        return null;
    }
    const objectTypeMap = {
        [ModelIdTag.User]: 'user',
        [ModelIdTag.Account]: 'account',
        [ModelIdTag.CardOrder]: 'card.order',
        [ModelIdTag.Card]: 'card',
        [ModelIdTag.Transaction]: 'transaction',
        [ModelIdTag.Budget]: 'budget',
        [ModelIdTag.ScheduleTask]: 'schedule.task',
        [ModelIdTag.SpendControl]: 'spend.control',
        [ModelIdTag.Approval]: 'approval',
        [ModelIdTag.Balance]: 'balance',
        [ModelIdTag.BalanceHistory]: 'balance.history',
        [ModelIdTag.Beneficiary]: 'beneficiary',
        [ModelIdTag.Audit]: 'audit',
        [ModelIdTag.Business]: 'business',
    };

    return objectTypeMap[tag];
}

export function GetTagByObjectModel(model: ObjectModel | string) {
    const tagMap = {
        [ObjectModel.User]: ModelIdTag.User,
        [ObjectModel.Account]: ModelIdTag.Account,
        [ObjectModel.CardOrder]: ModelIdTag.CardOrder,
        [ObjectModel.Card]: ModelIdTag.Card,
        [ObjectModel.Transaction]: ModelIdTag.Transaction,
        [ObjectModel.Wallet]: ModelIdTag.Budget,
        [ObjectModel.ScheduleTask]: ModelIdTag.ScheduleTask,
        [ObjectModel.SpendControl]: ModelIdTag.SpendControl,
        [ObjectModel.Approval]: ModelIdTag.Approval,
        [ObjectModel.Balance]: ModelIdTag.Balance,
        [ObjectModel.BalanceHistory]: ModelIdTag.BalanceHistory,
        [ObjectModel.Beneficiary]: ModelIdTag.Beneficiary,
        [ObjectModel.Audit]: ModelIdTag.Audit,
        [ObjectModel.Business]: ModelIdTag.Business,
    };

    return tagMap[model];
}

export function LedgerOptionsWithMeta(
    doc: HydratedDocument<any>,
    options?: ExecutionOptions,
): ExecutionOptions & LedgerMetadata {
    return { ...options, meta: { insertedBy: doc._id } };
}
