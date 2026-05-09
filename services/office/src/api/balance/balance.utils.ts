import { AccountCurrency } from '@api/account/account.enums';
import { TransactionCurrency, TransactionMode } from '@api/transactions/transactions.enums';
import { GetModelTag, TagMongoId, TenantDataSource, Utils } from '@core/helpers';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import {
    BalanceHistoryEntry,
    BalanceStatementEntry,
    BankTransferTransactionTypes,
    TransactionStatementDataPayee,
} from './balance.interface';
import { BalanceStatementAggregatedDoc } from './balance.interface';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { PaymentType } from '@api/payments/payment.enums';
import { CardAuthorizationType } from '@api/card-authorizations/card-authorization.schema';

export function toISVServerTenant(request: TenantRequestPayload) {
    return request.tenantId === TenantDataSource.Live ? 'LIVE' : 'SANDBOX';
}

export function toAccountCurrency(currency: TransactionCurrency) {
    switch (currency) {
        case TransactionCurrency.NGN:
            return AccountCurrency.NGN;
        default:
            return AccountCurrency.NGN;
    }
}

export function toTransactionCurrency(currency: AccountCurrency) {
    switch (currency) {
        case AccountCurrency.NGN:
            return TransactionCurrency.NGN;
        default:
            return TransactionCurrency.NGN;
    }
}

export function transactionCurrencyCompare(currency1: TransactionCurrency, currency2: AccountCurrency) {
    return currency1 === toTransactionCurrency(currency2);
}

export function accountCurrencyCompare(currency1: AccountCurrency, currency2: TransactionCurrency) {
    return currency1 === toAccountCurrency(currency2);
}

export function getTotalBalancePipeline() {
    const matchStage = {
        $match: {
            '_meta.piRef': 'Account',
        },
    };

    const groupStage = {
        $group: {
            _id: null,
            totalBalance: { $sum: '$available' },
        },
    };

    const projectStage = {
        $project: {
            totalBalance: 1,
        },
    };

    return [matchStage, groupStage, projectStage];
}

export function getBalanceHistoryPipeline(conditions: Record<string, string>) {
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
                            processorData: 1,
                            amount: 1,
                            fees: 1,
                            data: {
                                narration: 1,
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
                            sessionId: '$processorData.sessionId',
                            reference: '$reference',
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
                            reference: '$networkData.reference',
                            description: '$networkData.cardAcceptorNameLocation',
                            data: {
                                channel: '$networkData.channel',
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
                            reference: '$reference',
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

    const transactionAddFieldsStage = {
        $addFields: { transaction: { $first: '$transaction' } },
    };

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
            beneficiary: { $first: '$beneficiary' },
        },
    };

    return [matchStage, ...sourceLookupStages, transactionAddFieldsStage, isReversalStage, projectionStage];
}

export function buildBalanceStatementData(doc: BalanceStatementAggregatedDoc, timezone: string): BalanceStatementEntry {
    // type
    const remarks = buildBalanceRemarks(doc);
    const typeDescriptor = getTransactionTypeDescriptor(doc.source?.type);

    // balance
    const balanceAfter = doc.available / 100;
    const moneyBalanceAfter = Utils.parseFloatToCurrency(balanceAfter, doc.currency);
    const balanceBefore = (doc.available - doc.availableChange) / 100;
    const moneyBalanceBefore = Utils.parseFloatToCurrency(balanceBefore, doc.currency);

    // amount
    const amount = doc.source ? doc.source.amount / 100 : doc.availableChange / 100;
    const moneyAmount = Utils.parseFloatToCurrency(amount, doc.currency);
    const signedAmount = doc.mode == TransactionMode.Credit ? amount : amount * -1;

    // fees
    const fees = doc.source ? doc.source.fees / 100 : 0;
    const moneyFees = Utils.parseFloatToCurrency(fees, doc.currency);
    const signedFees = fees * -1;

    // total
    const total = Math.abs(doc.availableChange) / 100;
    const signedTotal = doc.availableChange / 100;
    const moneyTotal = Utils.parseFloatToCurrency(total, doc.currency);

    // credit
    const amountIn = doc.mode == TransactionMode.Credit ? total : 0;
    const moneyIn = doc.mode == TransactionMode.Credit ? moneyTotal : null;

    // debit
    const amountOut = doc.mode == TransactionMode.Debit ? total : 0;
    const moneyOut = doc.mode == TransactionMode.Debit ? moneyTotal : null;

    const payee = buildBalancePayee(doc);

    return Utils.removeNilValues<BalanceStatementEntry>({
        timezone: timezone,
        typeDescriptor: typeDescriptor,

        txTimeUTC: format(utcToZonedTime(doc.txTime, timezone), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        txDate: format(utcToZonedTime(doc.txTime, timezone), 'd/MM/yyyy'),
        txHourTime: format(utcToZonedTime(doc.txTime, timezone), 'hh:mm aa'),

        reference: doc.source?.reference,
        isReversal: doc.isReversal,

        mode: doc.mode,
        currency: doc.currency,
        description: doc.source?.description,
        remarks: remarks,
        narration: doc.source?.data?.narration,
        signedAmount,
        balanceBefore,
        balanceAfter,
        moneyBalanceBefore,
        moneyBalanceAfter,

        amount,
        moneyAmount,
        fees,
        moneyFees,
        signedFees,
        total,
        signedTotal,
        moneyTotal,
        amountIn,
        moneyIn,
        amountOut,
        moneyOut,

        payeeName: payee?.name,
    });
}

export function buildBalanceHistoryData(doc: BalanceStatementAggregatedDoc): BalanceHistoryEntry {
    // source
    const source = doc.source ? TagMongoId(GetModelTag(doc.source.sourceRef), doc.source.sourceId) : null;

    // type
    const typeDescriptor = getTransactionTypeDescriptor(doc.source?.type);

    // balance
    const balanceAfter = doc.available / 100;
    const balanceBefore = (doc.available - doc.availableChange) / 100;

    // total
    const signedTotal = doc.availableChange / 100;

    return Utils.removeNilValues<BalanceHistoryEntry>({
        typeDescriptor: typeDescriptor,
        txTimeUTC: format(doc.txTime, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        source: source,
        reference: doc.source?.reference ?? doc.source?.sessionId,
        mode: doc.mode,
        currency: doc.currency,
        description: doc.source?.description,
        balanceBefore,
        balanceAfter,
        signedTotal,
    });
}

function buildBalanceRemarks(doc: BalanceStatementAggregatedDoc): string {
    const txn = doc.source;

    if (doc.isReversal) {
        return `Reversal of ${txn.reference}`;
    }

    if (BankTransferTransactionTypes.includes(txn.type as PaymentType)) {
        if (doc.beneficiary) {
            if (txn.data?.narration) {
                return `Bank Transfer to ${doc.beneficiary?.accountNumber} | ${txn.reference} | ${txn.data.narration}`;
            }

            return `Bank Transfer to ${doc.beneficiary?.accountNumber} | ${txn.reference} `;
        }

        if (txn.data?.narration) {
            return `Bank Transfer | ${txn.reference} | ${txn.data.narration}`;
        }

        return `Bank Transfer | ${txn.reference} `;
    }

    if (doc.source.type === CardAuthorizationType.Capture && txn.data?.channel) {
        return `${txn.data.channel.toUpperCase()} Payment | ${txn.reference}`;
    }

    return null;
}

function buildBalancePayee(doc: BalanceStatementAggregatedDoc): TransactionStatementDataPayee {
    if (doc.beneficiary) {
        return {
            name: doc.beneficiary.name,
            abbr: getNameInitials(doc.beneficiary.accountName),
            bankName: doc.beneficiary.bankName,
            bankAccountNumber: doc.beneficiary.accountNumber,
            bankAccountName: doc.beneficiary.accountName,
            bankImageUrl: doc.beneficiary.imageUrl,
        };
    }

    return null;
}

export function getTransactionTypeDescriptor(type: string): string {
    switch (type) {
        case PaymentType.PayIn:
            return 'Pay In';
        case PaymentType.PayOut:
            return 'Pay Out';
        case 'capture':
            return 'Card Transaction';
        default:
            return 'Transaction';
    }
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
