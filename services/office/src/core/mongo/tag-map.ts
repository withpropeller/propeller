import { CryptoUtils } from '@core/crypto/utils';
import { ModelIdTag, ObjectModel } from './mongo.enums';
import { isEnum } from 'class-validator';
import { MODEL_PREFIX_SEPARATOR } from './mongo.utils';
import { Types } from 'mongoose';

export interface TagMap {
    tag: ModelIdTag;
    id: Types.ObjectId;
    model: ObjectModel;
    tagId: string;
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
    if (typeof str === 'string') {
        const tag = str.split(MODEL_PREFIX_SEPARATOR).slice(0, -1).join(MODEL_PREFIX_SEPARATOR);
        const encodedId = str.split(MODEL_PREFIX_SEPARATOR).slice(-1)[0];

        const id = CryptoUtils.base58DecodeObjectId(encodedId);

        if (Array.isArray(allowedTags) && allowedTags.includes(tag as ModelIdTag) && id) {
            return { tag: tag as ModelIdTag, id, model: GetTagModel(tag), tagId: str };
        }

        if (!Array.isArray(allowedTags) && isEnum(tag, ModelIdTag) && id) {
            return { tag: tag as ModelIdTag, id, model: GetTagModel(tag), tagId: str };
        }
    }

    return null;
}

export function GetTagModel(tag: string): ObjectModel {
    if (!tag) {
        return null;
    }
    const tagModelMap = {
        [ModelIdTag.Business]: 'Business',
        [ModelIdTag.Customer]: 'Customer',
        [ModelIdTag.Webhook]: 'Webhook',
        [ModelIdTag.Account]: 'Account',
        [ModelIdTag.CardProgram]: 'CardProgram',
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
