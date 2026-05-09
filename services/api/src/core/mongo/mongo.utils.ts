import { Utils } from '../helpers/utils';
import { isObjectIdOrHexString, SchemaOptions, Types } from 'mongoose';
import { CryptoUtils } from '@core/crypto/utils';
import { ModelIdTag } from './mongo.enums';
import { isEnum } from 'class-validator';

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
                    stringed = TagMongoId(tag, new Types.ObjectId(stringed));
                }

                if (tag && Array.isArray(stringed)) {
                    stringed = stringed.map((v) => (typeof v == 'string' ? TagMongoId(tag, new Types.ObjectId(v)) : v));
                }

                return { ...prev, [curr]: stringed };
            }, rest);
        }

        if (opts.pick) {
            rest = Utils.pickKeys(rest, opts.pick);
        }

        if (Array.isArray(opts.redact)) {
            const redact = '... ' + opts.redact.map((v) => '*' + v).join(' ');
            rest = Utils.pickKeys(rest, redact);
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
    redact?: string[];
    timestamps?: boolean;
    tag?: string;
    collection?: string;
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
    redact?: string[],
    timestamps = true,
    func?: (ret) => any,
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

export type Stringable = { toString: () => string };

export const MongoIdEquals = (x: Stringable, y: Stringable) => x.toString() === y.toString();

export const MongoIdIncludes = (arr: Stringable[], x: Stringable) =>
    arr.map((v) => v.toString()).includes(x.toString());

export function TagMongoId(tag: string, id: Types.ObjectId) {
    if (!id) {
        return null;
    }
    return TagId(tag, CryptoUtils.base58EncodeObjectId(id));
}

export function TagId(tag: string, id: string) {
    return `${tag}${MODEL_PREFIX_SEPARATOR}${id}`;
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

export function ensureObjectId(id: string | Types.ObjectId) {
    return typeof id === 'string' && isObjectIdOrHexString(id) ? new Types.ObjectId(id) : id;
}

export function objectRefPropRequired(ref: string) {
    return {
        type: Types.ObjectId,
        ref,
        required: true,
    };
}

export function objectIdProp(ref: string) {
    return {
        type: Types.ObjectId,
        ref,
    };
}

export function objectRefPathPropRequired(refPath: string) {
    return {
        type: Types.ObjectId,
        refPath,
        required: true,
    };
}

export function objectRefPathProp(refPath: string) {
    return {
        type: Types.ObjectId,
        refPath,
    };
}

export function GetObjectType(tag: string) {
    if (!tag) {
        return null;
    }
    const objectTypeMap = {
        [ModelIdTag.Customer]: 'customer',
        [ModelIdTag.Webhook]: 'webhook',
        [ModelIdTag.Account]: 'account',
        [ModelIdTag.Balance]: 'balance',
        [ModelIdTag.BalanceHistory]: 'balance.history',
        [ModelIdTag.CardProgram]: 'card.program',
        [ModelIdTag.Card]: 'card',
        [ModelIdTag.CardTransaction]: 'card.transaction',
        [ModelIdTag.CardAuthorization]: 'card.authorization',
        [ModelIdTag.Dispute]: 'dispute',
        [ModelIdTag.Payment]: 'payment',
        [ModelIdTag.Event]: 'event',
        [ModelIdTag.EventAttempt]: 'event.attempt',
        [ModelIdTag.Request]: 'request',
        [ModelIdTag.Merchant]: 'merchant',
        [ModelIdTag.Fee]: 'fee',
        [ModelIdTag.Configuration]: 'configuration',
    };

    return objectTypeMap[tag];
}

export function GetModelTag(model: string): string {
    if (!model) {
        return null;
    }

    const modelTagMap = {
        Customer: ModelIdTag.Customer,
        Webhook: ModelIdTag.Webhook,
        Account: ModelIdTag.Account,
        CardProgram: ModelIdTag.CardProgram,
        Card: ModelIdTag.Card,
        CardTransaction: ModelIdTag.CardTransaction,
        CardAuthorization: ModelIdTag.CardAuthorization,
        Dispute: ModelIdTag.Dispute,
        Payment: ModelIdTag.Payment,
        Event: ModelIdTag.Event,
        EventAttempt: ModelIdTag.EventAttempt,
        Request: ModelIdTag.Request,
        Merchant: ModelIdTag.Merchant,
        Fee: ModelIdTag.Fee,
        Configuration: ModelIdTag.Configuration,
    };

    return modelTagMap[model];
}

export interface TagMap {
    tag: ModelIdTag;
    id: Types.ObjectId;
    model: string;
}

export function ParseArrTagId(str: string[], allowedTags?: ModelIdTag[]): Types.ObjectId[] {
    if (Array.isArray(str)) {
        return str.map((s) => ParseTagId(s, allowedTags)).filter((id) => id);
    }

    return [];
}

export function ParseTagId(str: string, allowedTags?: ModelIdTag[]): Types.ObjectId {
    if (typeof str === 'string') {
        const splitted = str.split(MODEL_PREFIX_SEPARATOR);
        if (splitted.length === 1 && Types.ObjectId.isValid(splitted[0])) {
            return new Types.ObjectId(splitted[0]);
        }
        const tag = splitted.slice(0, -1).join(MODEL_PREFIX_SEPARATOR);
        const encodedId = str.split(MODEL_PREFIX_SEPARATOR).slice(-1)[0];

        const id = CryptoUtils.base58DecodeObjectId(encodedId);
        if (Array.isArray(allowedTags) && allowedTags.includes(tag as ModelIdTag) && id) {
            return id;
        }

        if (!Array.isArray(allowedTags) && isEnum(tag, ModelIdTag) && id) {
            return id;
        }
    }

    return null;
}

export function ParseArrTagMap(str: string[], allowedTags?: ModelIdTag[]): TagMap[] {
    return str.map((s) => ParseTagMap(s, allowedTags));
}

export function ParseTagMap(str: string, allowedTags?: ModelIdTag[]): TagMap {
    if (str) {
        const tag = str.split(MODEL_PREFIX_SEPARATOR).slice(0, -1).join(MODEL_PREFIX_SEPARATOR);
        const encodedId = str.split(MODEL_PREFIX_SEPARATOR).slice(-1)[0];

        const id = CryptoUtils.base58DecodeObjectId(encodedId);

        if (Array.isArray(allowedTags) && allowedTags.includes(tag as ModelIdTag) && Types.ObjectId.isValid(id)) {
            return { tag: tag as ModelIdTag, id, model: GetTagModel(tag) };
        }

        if (!Array.isArray(allowedTags) && isEnum(tag, ModelIdTag) && Types.ObjectId.isValid(id)) {
            return { tag: tag as ModelIdTag, id, model: GetTagModel(tag) };
        }
    }

    return null;
}

export function GetTagModel(tag: string): string {
    if (!tag) {
        return null;
    }
    const tagModelMap = {
        [ModelIdTag.Customer]: 'Customer',
        [ModelIdTag.Webhook]: 'Webhook',
        [ModelIdTag.Account]: 'Account',
        [ModelIdTag.CardProgram]: 'CardProgram',
        [ModelIdTag.CardBin]: 'CardBin',
        [ModelIdTag.Card]: 'Card',
        [ModelIdTag.CardTransaction]: 'CardTransaction',
        [ModelIdTag.CardAuthorization]: 'CardAuthorization',
        [ModelIdTag.Dispute]: 'Dispute',
        [ModelIdTag.Payment]: 'Payment',
        [ModelIdTag.Event]: 'Event',
        [ModelIdTag.EventAttempt]: 'EventAttempt',
        [ModelIdTag.Request]: 'Request',
        [ModelIdTag.Merchant]: 'Merchant',
        [ModelIdTag.Fee]: 'Fee',
        [ModelIdTag.Configuration]: 'Configuration',
    };

    return tagModelMap[tag];
}
