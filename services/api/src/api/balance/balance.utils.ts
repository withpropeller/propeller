import { AccountCurrency } from '@api/account/account.enums';
import { TransactionCurrency, TransactionMode } from '@api/transactions/transactions.enums';
import { ObjectType, TenantDataSource, Utils } from '@core/helpers';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { BalanceHistoryEntry, BalanceStatementTransaction } from './balance.interface';
import { BalanceStatementAggregatedDoc } from './balance.interface';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { PaymentMethod, PaymentType } from '@api/payments/payment.enums';
import { TagMongoId, GetModelTag } from '@core/mongo';
import { GenerateStatementDto } from '@api/account/account.dto';
import { Types } from 'mongoose';

export function toISVServerTenant(request: TenantRequestPayload) {
    return request.tenantId === TenantDataSource.Live ? 'LIVE' : 'SANDBOX';
}

export function toAccountCurrency(currency: TransactionCurrency) {
    switch (currency) {
        case TransactionCurrency.NGN:
            return AccountCurrency.NGN;
        case TransactionCurrency.USD:
            return AccountCurrency.USD;
        default:
            return undefined;
    }
}

export function toTransactionCurrency(currency: AccountCurrency) {
    switch (currency) {
        case AccountCurrency.NGN:
            return TransactionCurrency.NGN;
        case AccountCurrency.USD:
            return TransactionCurrency.USD;
        default:
            return undefined;
    }
}

export function transactionCurrencyCompare(currency1: TransactionCurrency, currency2: AccountCurrency) {
    return currency1 === toTransactionCurrency(currency2);
}

export function accountCurrencyCompare(currency1: AccountCurrency, currency2: TransactionCurrency) {
    return currency1 === toAccountCurrency(currency2);
}

export function getBalanceStatementPipelineOld(balanceId: Types.ObjectId, query: GenerateStatementDto) {
    const matchStage = {
        $match: {
            '_meta.origId': balanceId,
            '_meta.txTime': { $gte: Utils.safeDate(query.startDate), $lt: Utils.safeDate(query.endDate) },
        },
    };

    const sourceLookupStages = [
        {
            $lookup: {
                from: 'payments',
                localField: 'source',
                foreignField: '_id',
                as: 'payment',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            type: 1,
                            reference: 1,
                            amount: 1,
                            fees: 1,
                            method: 1,
                            data: {
                                narration: '$methodData.bankTransfer.narration',
                                sessionId: '$processorData.sessionId',
                                accountName: '$methodData.bankTransfer.accountName',
                                bankName: '$methodData.bankTransfer.bankName',
                                accountNumber: '$methodData.bankTransfer.accountNumber',
                            },
                            reversalTimeline: {
                                $filter: {
                                    input: '$timeline',
                                    as: 'tl',
                                    cond: { $in: ['$$tl.action', ['funds-reversed']] },
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            sourceId: '$_id',
                            sourceRef: 'Payment',
                            method: '$method',
                            data: '$data',
                            type: '$type',
                            amount: '$amount',
                            fees: '$fees',
                            reversalBalanceLogs: '$reversalTimeline.data.balanceLog',
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: 'cardauthorizations',
                localField: 'source',
                foreignField: '_id',
                as: 'cardAuthorization',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            type: 1,
                            amount: 1,
                            fees: 1,
                            data: {
                                channel: '$networkData.channel',
                                reference: '$networkData.reference',
                                stan: '$networkData.stan',
                                rrn: '$networkData.rrn',
                                terminalId: '$networkData.terminalId',
                                merchantDescriptor: '$networkData.cardAcceptorNameLocation',
                            },
                            reversalTimeline: {
                                $filter: {
                                    input: '$timeline',
                                    as: 'tl',
                                    cond: { $in: ['$$tl.action', ['funds-reversed']] },
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            sourceId: '$_id',
                            sourceRef: 'CardAuthorization',
                            type: '$type',
                            amount: '$amount',
                            fees: '$fees',
                            data: '$data',
                            reversalBalanceLogs: '$reversalTimeline.data.balanceLog',
                        },
                    },
                ],
            },
        },
    ];

    const isReversalStage = {
        $addFields: {
            isReversal: {
                $cond: [{ $in: ['$_id', ['$transaction.reversalBalanceLogs']] }, true, false],
            },
        },
    };

    const projectionStage = {
        $project: {
            availableChange: 1,
            available: 1,
            currency: 1,
            mode: 1,
            txTime: '$_meta.txTime',
            source: { $first: { $setUnion: ['$payment', '$cardAuthorization'] } },
            isReversal: 1,
        },
    };

    return [matchStage, ...sourceLookupStages, isReversalStage, projectionStage];
}

export function getBalanceStatementPipeline(balanceId: Types.ObjectId, query: GenerateStatementDto) {
    const conditions = {
        '_meta.origId': balanceId,
        '_meta.txTime': { $gte: Utils.safeDate(query.startDate), $lt: Utils.safeDate(query.endDate) },
    };

    return getBalanceHistoryPipeline(conditions);
}

export function getBalanceHistoryPipeline(conditions: Record<string, any>) {
    const matchStage = { $match: conditions };

    const sourceLookupStages = [
        {
            $lookup: {
                from: 'payments',
                localField: 'source',
                foreignField: '_id',
                as: 'payment',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            type: 1,
                            reference: 1,
                            amount: 1,
                            fees: 1,
                            method: 1,
                            data: {
                                accountName: '$methodData.bankTransfer.accountName',
                                bankName: '$methodData.bankTransfer.bankName',
                                accountNumber: '$methodData.bankTransfer.accountNumber',
                                narration: '$methodData.bankTransfer.narration',
                                sessionId: '$processorData.sessionId',
                                fxChargeAmount: '$methodData.fxCharge.amount',
                                fxChargeType: '$methodData.fxCharge.type',
                            },
                            reversalTimeline: {
                                $filter: {
                                    input: '$timeline',
                                    as: 'tl',
                                    cond: { $in: ['$$tl.action', ['funds-reversed']] },
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            sourceId: '$_id',
                            sourceRef: 'Payment',
                            method: '$method',
                            data: '$data',
                            type: '$type',
                            amount: '$amount',
                            fees: '$fees',
                            reversalBalanceLogs: '$reversalTimeline.data.balanceLog',
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: 'cardauthorizations',
                localField: 'source',
                foreignField: '_id',
                as: 'cardAuthorization',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            type: 1,
                            amount: 1,
                            fees: 1,
                            data: {
                                channel: '$networkData.channel',
                                reference: '$networkData.reference',
                                stan: '$networkData.stan',
                                rrn: '$networkData.rrn',
                                terminalId: '$networkData.terminalId',
                                merchantDescriptor: '$networkData.cardAcceptorNameLocation',
                            },
                            reversalTimeline: {
                                $filter: {
                                    input: '$timeline',
                                    as: 'tl',
                                    cond: { $in: ['$$tl.action', ['funds-reversed']] },
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            sourceId: '$_id',
                            sourceRef: 'CardAuthorization',
                            type: '$type',
                            amount: '$amount',
                            fees: '$fees',
                            data: '$data',
                            reversalBalanceLogs: '$reversalTimeline.data.balanceLog',
                        },
                    },
                ],
            },
        },
    ];

    const isReversalStage = {
        $addFields: {
            isReversal: {
                $cond: [{ $in: ['$_id', ['$transaction.reversalBalanceLogs']] }, true, false],
            },
        },
    };

    const projectionStage = {
        $project: {
            availableChange: 1,
            available: 1,
            currency: 1,
            mode: 1,
            txTime: '$_meta.txTime',
            source: { $first: { $setUnion: ['$payment', '$cardAuthorization'] } },
            isReversal: 1,
        },
    };

    return [matchStage, ...sourceLookupStages, isReversalStage, projectionStage];
}

export function buildBalanceStatementTxnData(
    doc: BalanceStatementAggregatedDoc,
    timezone: string,
): BalanceStatementTransaction {
    const amount = doc.availableChange;

    // balance
    const balanceAfter = doc.available;
    const balanceBefore = doc.available - doc.availableChange;

    // credit
    const amountIn = doc.mode == TransactionMode.Credit ? amount : 0;

    // debit
    const amountOut = doc.mode == TransactionMode.Debit ? amount : 0;

    //reference
    const reference = getTransactionReference(doc);

    // description
    const { description, narration, type } = getTxnTypeDescriptionNarration(doc);

    return {
        date: format(utcToZonedTime(doc.txTime, timezone), 'd/MM/yyyy'),
        timeStr: format(utcToZonedTime(doc.txTime, timezone), 'hh:mm aa'),
        description: description,
        amount: amount,
        amountIn: amountIn,
        amountOut: amountOut,
        type: type,
        narration: narration,
        reference: reference,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
    };
}

export function buildBalanceHistoryData(doc: BalanceStatementAggregatedDoc): BalanceHistoryEntry {
    // source
    const source = doc.source ? TagMongoId(GetModelTag(doc.source.sourceRef), doc.source.sourceId) : null;

    // balance
    const balanceAfter = doc.available / 100;
    const balanceBefore = (doc.available - doc.availableChange) / 100;

    // total
    const signedTotal = doc.availableChange / 100;

    //description
    const { description, narration, type } = getTxnTypeDescriptionNarration(doc);

    return Utils.removeNilValues<BalanceHistoryEntry>({
        typeDescriptor: type,
        txTimeUTC: format(doc.txTime, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        source: source,
        reference: doc.source?.reference,
        mode: doc.mode,
        currency: doc.currency,
        description: description,
        narration: narration,
        balanceBefore,
        balanceAfter,
        signedTotal,
    });
}

export function getTransactionTypeDescriptor(doc: BalanceStatementAggregatedDoc): string {
    if (doc.source && doc.source.sourceRef == 'CardAuthorization') {
        const mode = doc.isReversal ? 'Reversal' : 'Charge';
        return `Card ${mode}`;
    }

    if (doc.source && doc.source.sourceRef == 'Payment') {
        if (doc.source.type == PaymentType.PayIn && doc.source.method == PaymentMethod.BankTransfer) {
            return 'Payin: Bank Transfer';
        }

        if (doc.source.type == PaymentType.PayOut && doc.source.method == PaymentMethod.BankTransfer) {
            return 'Payout: Bank Transfer';
        }

        if (doc.source.type == PaymentType.PayIn && doc.source.method == PaymentMethod.Refund) {
            return 'Dispute Refund';
        }

        if (doc.source.method == PaymentMethod.FxCharge) {
            return 'Charge: FX';
        }
    }

    return 'Transaction';
}

function getTransactionReference(doc: BalanceStatementAggregatedDoc): string {
    // source
    const source = doc.source ? TagMongoId(GetModelTag(doc.source.sourceRef), doc.source.sourceId) : null;

    if (doc.source?.sourceRef === 'Payment' && doc.source?.data.reference) {
        return source + ' | ' + doc.source.data.reference + ' | ' + doc.source.data.sessionId;
    }

    if (doc.source?.sourceRef === 'Payment' && doc.source?.data.sessionId) {
        return source + ' | ' + doc.source.data.sessionId;
    }

    if (doc.source?.sourceRef === 'CardAuthorization' && doc.source?.data.stan && doc.source?.data.rrn) {
        return source + ' | ' + doc.source.data.stan + ' | ' + doc.source.data.rrn;
    }

    if (doc.source?.sourceRef === 'CardAuthorization') {
        return source;
    }

    return source ?? 'Transaction';
}

export function getNameInitials(name: string): string {
    const splitName = name.split(' ');
    if (splitName.length === 1) {
        return splitName[0].slice(0, 2).toUpperCase();
    }

    const allInitials = splitName
        .map((v) => v[0])
        .join('')
        .toUpperCase();

    if (allInitials.length <= 2) {
        return allInitials;
    }

    // take the first and last only
    return allInitials[0] + allInitials[allInitials.length - 1];
}

function getTxnTypeDescriptionNarration(doc: BalanceStatementAggregatedDoc): {
    description: string;
    narration?: string;
    type: string;
} {
    if (doc.source && doc.source.sourceRef == 'CardAuthorization') {
        const mode = doc.isReversal ? 'Reversal' : 'Charge';
        return { type: `Card ${mode}`, description: doc.source.data.merchantDescriptor };
    }

    if (doc.source && doc.source.sourceRef == 'Payment') {
        if (doc.source.type == PaymentType.PayIn && doc.source.method == PaymentMethod.BankTransfer) {
            return {
                type: 'Payin: Bank Transfer',
                description: `From: ${doc.source.data.accountName} (${doc.source.data.bankName} - ${doc.source.data.accountNumber})`,
                narration: doc.source.data.narration,
            };
        }

        if (doc.source.type == PaymentType.PayOut && doc.source.method == PaymentMethod.BankTransfer) {
            return {
                type: 'Payout: Bank Transfer',
                description: `To: ${doc.source.data.accountName} (${doc.source.data.bankName} - ${doc.source.data.accountNumber})`,
                narration: doc.source.data.narration,
            };
        }

        if (doc.source.type == PaymentType.PayIn && doc.source.method == PaymentMethod.Refund) {
            return {
                type: 'Dispute Refund',
                description: `From: ${doc.source.data.accountName} (${doc.source.data.bankName} - ${doc.source.data.accountNumber})`,
                narration: doc.source.data.narration,
            };
        }

        if (doc.source.method == PaymentMethod.FxCharge) {
            return {
                type: 'Charge: FX',
                description: `${Utils.fromSlug(doc.source.data.fxChargeType)} of ${doc.source.data.fxChargeAmount}`,
            };
        }
    }

    return { type: 'Transaction', description: 'Transaction' };
}

/*function _getAccountLogNarrationType(doc: BalanceStatementAggregatedDoc): {
    description: string;
    narration?: string;
    type: string;
} {
    if (doc.source && doc.source.object == ObjectType.CardAuthorization) {
        const source = doc.source as CardAuthorization;
        const mode = doc.mode === TransactionMode.Credit ? 'Reversal' : 'Charge';
        return { type: `Card ${mode}`, description: source.networkData.cardAcceptorNameLocation };
    }

    if (log.source && log.source.object == ObjectType.Payment) {
        const source = log.source as Payment;
        if (source.type == PaymentType.PayOut && source.methodData?.bankTransfer) {
            return {
                type: 'Bank Transfer',
                description: `To: ${source.methodData.bankTransfer.accountName} (${source.methodData.bankTransfer.bankName} - ${source.methodData.bankTransfer.accountNumber})`,
                narration: source.methodData.bankTransfer.narration,
            };
        }
        if (source.type == PaymentType.PayIn && source.methodData?.bankTransfer) {
            return {
                type: 'Bank Transfer',
                description: `From: ${source.methodData.bankTransfer.accountName} (${source.methodData.bankTransfer.bankName} - ${source.methodData.bankTransfer.accountNumber})`,
                narration:
                    source.methodData.bankTransfer.narration == 'null' ? '' : source.methodData.bankTransfer.narration,
            };
        }

        if (source.methodData?.fxCharge) {
            const currencyAmount = Utils.parseInt64ToCurrency(
                source.methodData?.fxCharge?.amount,
                source.methodData?.fxCharge?.currency,
            );
            return {
                type: 'FX Charge',
                description: `${Utils.fromSlug(source.methodData.fxCharge.type)} of ${currencyAmount}`,
            };
        }
    }

    return { type: '', description: '' };
}*/
