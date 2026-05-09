import { Utils } from '@core/helpers';
import { ModelIdTag, TagMongoId } from '@core/mongo';
import { format } from 'date-fns';
import { DisputeCSVEntry } from './dispute.interface';
import { ReserveAccountSlugNGNCardDisputeRefund, ReserveAccountSlugNGNVostro } from '@api/reserve-accounts';

export function getDisputePipeline(conditions: any) {
    const matchStage = { $match: conditions };

    const disputeInnerPipeline = [
        {
            $lookup: {
                from: 'cards',
                localField: 'card',
                foreignField: '_id',
                as: 'card',
                pipeline: [
                    { $lookup: { from: 'cardprograms', localField: 'program', foreignField: '_id', as: 'program' } },
                    {
                        $project: {
                            last4: '$details.last4',
                            expiry: '$details.expiry',
                            bin: { $first: '$program.config.partnerBin' },
                        },
                    },
                ],
            },
        },
        {
            $project: {
                _id: 0,
                card: 1,
                createdAt: '$createdAt',
                rrn: '$networkData.rrn',
                stan: '$networkData.stan',
                narration: '$networkData.cardAcceptorNameLocation',
                terminalId: '$networkData.terminalId',
                channel: '$channel',
                sessionId: '$processorData.sessionId',
            },
        },
        { $unwind: '$card' },
    ];

    const paymentsLookupStage = {
        $lookup: {
            from: 'payments',
            localField: 'source',
            foreignField: '_id',
            as: 'payments',
            pipeline: [
                {
                    $project: {
                        _id: 0,
                        sessionId: '$processorData.sessionId',
                    },
                },
            ],
        },
    };

    const cardAuthorizationsLookupStage = {
        $lookup: {
            from: 'cardauthorizations',
            localField: 'source',
            foreignField: '_id',
            as: 'cardAuthorizations',
            pipeline: disputeInnerPipeline,
        },
    };

    const cardTransactionsLookupStage = {
        $lookup: {
            from: 'cardtransactions',
            localField: 'source',
            foreignField: '_id',
            as: 'cardTransactions',
            pipeline: disputeInnerPipeline,
        },
    };

    const projectionStage = {
        $project: {
            amount: 1,
            status: 1,
            sourceRef: 1,
            currency: 1,
            statusReason: 1,
            createdAt: 1,
            details: { $first: { $setUnion: ['$cardTransactions', '$cardAuthorizations', '$payments'] } },
        },
    };

    const sortStage = {
        $sort: {
            createdAt: -1,
        },
    };

    return [
        matchStage,
        paymentsLookupStage,
        cardAuthorizationsLookupStage,
        cardTransactionsLookupStage,
        projectionStage,
        sortStage,
    ];
}

export function buildDisputeCVData(doc: any): DisputeCSVEntry {
    return {
        id: TagMongoId(ModelIdTag.Dispute, doc._id),
        type: buildDisputeType(doc.sourceRef),
        status: doc.status,
        statusReason: doc.statusReason,
        currency: doc.currency,
        amount: doc.amount / 100,
        amountMoney: Utils.parseInt64ToCurrency(doc.amount, doc.currency),
        maskedPan: doc.details?.card ? doc.details.card.bin + '********' + doc.details.card.last4 : '',
        cardExpiry: doc.details?.card ? doc.details.card.expiry : '',
        rrn: doc.details ? 'RRN-' + doc.details.rrn : '',
        stan: doc.details ? 'STAN-' + doc.details.stan : '',
        terminalId: doc.details?.terminalId,
        narration: doc.details?.narration,
        channel: doc.details?.channel,
        sessionId: doc.details?.sessionId,
        txTime: doc.details?.createdAt ? format(doc.details.createdAt, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : '',
        createdAt: format(doc.createdAt, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    };
}

export function buildDisputeType(sourceRef: string): string {
    switch (sourceRef) {
        case 'CardTransaction':
            return 'card-transaction';
        case 'CardAuthorization':
            return 'card-transaction';
        case 'Payment':
            return 'payment';
        default:
            return 'unknown';
    }
}

export function getDisputeRefundReserveAccountSlug(sourceRef: string): string {
    switch (sourceRef) {
        case 'CardTransaction':
            return ReserveAccountSlugNGNCardDisputeRefund;
        case 'CardAuthorization':
            return ReserveAccountSlugNGNCardDisputeRefund;
        case 'Payment':
            return ReserveAccountSlugNGNVostro;
        default:
            return ReserveAccountSlugNGNVostro;
    }
}
