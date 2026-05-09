import { CryptoUtils } from '@core/crypto/utils';
import { ModelIdTag, ObjectModel } from './mongo.enums';
import { GetTagByObjectModel, MODEL_PREFIX_SEPARATOR, TagMongoId } from './mongo.utils';
import { isEnum, isMongoId } from 'class-validator';
import { Types } from 'mongoose';

export interface TagMap {
    tag: ModelIdTag;
    id: Types.ObjectId;
    model: ObjectModel;
    tagId: string;
}

export function buildTagMap(id: Types.ObjectId, model: ObjectModel): TagMap {
    const tag = GetTagByObjectModel(model);
    const tagId = TagMongoId(tag, id);
    return { tag, id, model, tagId };
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
        if (splitted.length === 1 && isMongoId(splitted[0])) {
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
        [ModelIdTag.Account]: 'Account',
        [ModelIdTag.Card]: 'Card',
        [ModelIdTag.CardOrder]: 'CardOrder',
        [ModelIdTag.Tag]: 'Tag',
        [ModelIdTag.Transaction]: 'Transaction',
        [ModelIdTag.Budget]: 'Budget',
        [ModelIdTag.Approval]: 'Approval',
        [ModelIdTag.ScheduleTask]: 'ScheduleTask',
        [ModelIdTag.SpendControl]: 'SpendControl',
        [ModelIdTag.Balance]: 'Balance',
        [ModelIdTag.BalanceHistory]: 'BalanceHistory',
        [ModelIdTag.Business]: 'Business',
        [ModelIdTag.User]: 'User',
    };

    return tagModelMap[tag];
}
