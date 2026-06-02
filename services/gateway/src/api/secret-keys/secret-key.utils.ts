import { Types } from 'mongoose';
import { startOfDay, subDays } from 'date-fns';

export function getSecretKeyRequestsTodayPipeline(businessId: Types.ObjectId, keyId: Types.ObjectId) {
    const todayStart = startOfDay(new Date());
    return [
        { $match: { business: businessId, secretKey: keyId, createdAt: { $gte: todayStart } } },
        { $count: 'count' },
    ];
}

export function getSecretKeyErrorsTodayPipeline(businessId: Types.ObjectId, keyId: Types.ObjectId) {
    const todayStart = startOfDay(new Date());
    return [
        {
            $match: {
                business: businessId,
                secretKey: keyId,
                createdAt: { $gte: todayStart },
                'attempts.statusCode': { $gte: 400 },
            },
        },
        { $count: 'count' },
    ];
}

export function getSecretKeyTotalRequestsPipeline(businessId: Types.ObjectId, keyId: Types.ObjectId) {
    return [{ $match: { business: businessId, secretKey: keyId } }, { $count: 'count' }];
}

export function getSecretKeyDailyRequestsPipeline(businessId: Types.ObjectId, keyId: Types.ObjectId, days = 7) {
    const start = subDays(startOfDay(new Date()), days - 1);
    return [
        { $match: { business: businessId, secretKey: keyId, createdAt: { $gte: start } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ];
}
