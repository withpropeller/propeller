import { ModelIdTag, TagMongoId } from '@core/mongo';
import { CardTransactionCSVEntry } from './card-transaction.interface';
import { format } from 'date-fns';
import { Utils } from '@core/helpers';

export function getTransactionPipeline(conditions: any) {
    const matchStage = { $match: conditions };

    const cardLookupStage = {
        $lookup: {
            from: 'cards',
            localField: 'card',
            foreignField: '_id',
            as: 'card',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        last4: '$details.last4',
                    },
                },
            ],
        },
    };

    const projectionStage = {
        $project: {
            currency: 1,
            channel: 1,
            merchantDescriptor: '$networkData.cardAcceptorNameLocation',
            merchantId: '$merchant',
            txnReference: '$networkData.txnReference',
            stan: '$networkData.stan',
            rrn: '$networkData.rrn',
            network: '$networkData.network',
            type: 1,
            statusReason: 1,
            amount: 1,
            fees: 1,
            cardId: { $first: '$card._id' },
            cardLast4: { $first: '$card.last4' },
            createdAt: 1,
        },
    };

    return [matchStage, cardLookupStage, projectionStage];
}

export function buildTransactionCVData(doc: any): CardTransactionCSVEntry {
    return {
        id: TagMongoId(ModelIdTag.CardTransaction, doc._id),
        channel: doc.channel,
        network: doc.network,
        amount: doc.amount / 100,
        fees: doc.fees / 100,
        amountMoney: Utils.parseInt64ToCurrency(doc.amount, doc.currency),
        feesMoney: Utils.parseInt64ToCurrency(doc.fees, doc.currency),
        type: doc.type,
        currency: doc.currency,
        merchantDescriptor: doc.merchantDescriptor,
        merchantId: TagMongoId(ModelIdTag.Merchant, doc.merchantId),
        stan: doc.stan ? 'STAN-' + doc.stan : '',
        rrn: doc.rrn ? 'RRN-' + doc.rrn : '',
        cardId: TagMongoId(ModelIdTag.Card, doc.cardId),
        cardLast4: doc.cardLast4,
        txTime: format(doc.createdAt, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    };
}
