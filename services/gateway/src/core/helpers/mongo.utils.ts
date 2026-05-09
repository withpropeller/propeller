import { Utils } from './utils';
import { isObjectIdOrHexString, SchemaOptions } from 'mongoose';
import { MODEL_PREFIX_SEPARATOR } from './constants';
import { CryptoUtils } from '@core/crypto/utils';
import { ModelIdTag } from './enums';

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
    transform?: (ret) => any;
}

/**
 * https://wanago.io/2021/08/30/api-nestjs-virtual-properties-mongodb-mongoose/
 *
 * @param spaceSeparatedKeys uses json-pick-keys to exclude keys
 * @param objectIds turns objectIds automatically to strings
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
    };
}

export type Stringable = { toString: () => string };

export const MongoIdEquals = (x: Stringable, y: Stringable) => x.toString() === y.toString();

export const MongoIdIncludes = (arr: Stringable[], x: Stringable) =>
    arr.map((v) => v.toString()).includes(x.toString());

export function TagMongoId(tag: string, id: string) {
    const encoded = CryptoUtils.base58EncodeObjectId(id);
    return `${tag}${MODEL_PREFIX_SEPARATOR}${encoded}`;
}

export function GetObjectType(tag: string) {
    const objectTypeMap = {
        [ModelIdTag.Customer]: 'customer',
        [ModelIdTag.Webhook]: 'webhook',
        [ModelIdTag.Account]: 'account',
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
    };

    return objectTypeMap[tag];
}
