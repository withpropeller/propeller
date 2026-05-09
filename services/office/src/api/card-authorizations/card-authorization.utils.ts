import { Utils } from '@core/helpers';
import { HydratedDocument } from 'mongoose';
import { format } from 'date-fns';
import { AppException } from '@core/exceptions';
import { CardAuthorization, NetworkDataRequestType } from './card-authorization.schema';
import { HmacHash } from '@core/crypto/hmac-hash';
import { ModelIdTag, TagMongoId } from '@core/mongo';
import { CardAuthorizationCSVEntry } from './card-authorization.interface';
import { CardAuthTimelineAction } from './card-authorization.enums';

export async function createInterswitchCaptureMac(body: any, secretKey: string) {
    const macStr = [
        body.transactionReference,
        body.requestId,
        body.walletId,
        body.amount,
        body.currencyCode,
        body.stan,
        body.rrn,
        body.transactionFee,
    ].join('');
    return HmacHash.hashHex(secretKey, macStr);
}

export async function createInterswitchReversalMac(body: any, secretKey: string) {
    const macStr = [
        body.transactionReference,
        body.originalTransactionReference,
        body.requestId,
        body.walletId,
        body.amount,
        body.currencyCode,
        body.stan,
        body.rrn,
        body.transactionFee,
    ].join('');
    return HmacHash.hashHex(secretKey, macStr);
}

export function createInterswitchDebitLienRequestBody(auth: HydratedDocument<CardAuthorization>) {
    if (!auth.networkData.requests || !auth.networkData.requests[0]) {
        throw AppException.BadRequest.setMessage('No request found');
    }

    if (auth.networkData.requests[0].type != NetworkDataRequestType.PlaceLien) {
        throw AppException.BadRequest.setMessage('Cannot refund a request that is not a place lien request');
    }

    const requestBody = auth.networkData.requests[0].requestBody;

    return {
        requestId: Utils.generateRandomID(15).toUpperCase(),
        stan: requestBody.stan,
        rrn: requestBody.rrn,
        walletId: requestBody.walletId,
        transactionReference: requestBody.transactionReference,
        originalTransactionReference: requestBody.transactionReference,
        acquiringInstitutionId: requestBody.acquiringInstitutionId,
        additionalFields: requestBody.additionalFields,
        merchantId: requestBody.merchantId,
        currencyCode: requestBody.currencyCode,
        amount: requestBody.amount,
        terminalId: requestBody.terminalId,
        terminalType: requestBody.terminalType,
        transactionDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        cardAcceptorNameLocation: requestBody.cardAcceptorNameLocation,
        transactionFee: requestBody.transactionFee,
        triggeredManually: true,
    };
}

export function createInterswitchDisputeRefundRequestBody(auth: HydratedDocument<CardAuthorization>) {
    if (!auth.networkData.requests || !auth.networkData.requests[0]) {
        throw AppException.BadRequest.setMessage('No request found');
    }

    let requestBody;

    const originatingRequest = auth.networkData.requests[0];

    if (originatingRequest.type == NetworkDataRequestType.Debit) {
        requestBody = originatingRequest.requestBody;
    }

    if (originatingRequest.type == NetworkDataRequestType.PlaceLien) {
        requestBody = auth.networkData.requests[1].requestBody;
    }

    if (!requestBody) {
        throw AppException.BadRequest.setMessage('No request body found');
    }

    return {
        requestId: Utils.generateRandomBytes(15).toUpperCase(),
        stan: requestBody.stan,
        rrn: requestBody.rrn,
        walletId: requestBody.walletId,
        transactionReference: Utils.generateRandomBytes(10).toUpperCase(),
        originalTransactionReference: requestBody.transactionReference,
        acquiringInstitutionId: requestBody.acquiringInstitutionId,
        additionalFields: requestBody.additionalFields,
        merchantId: requestBody.merchantId,
        currencyCode: requestBody.currencyCode,
        amount: requestBody.amount,
        terminalId: requestBody.terminalId,
        terminalType: requestBody.terminalType,
        transactionDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        cardAcceptorNameLocation: requestBody.cardAcceptorNameLocation,
        transactionFee: requestBody.transactionFee * -1,
        triggeredManually: true,
    };
}

export function createPavilionDebitLienRequestBody(auth: HydratedDocument<CardAuthorization>) {
    if (!auth.networkData.requests || !auth.networkData.requests[0]) {
        throw AppException.BadRequest.setMessage('No request found');
    }

    let requestBody;

    const originatingRequest = auth.networkData.requests[0];

    if (originatingRequest.type == NetworkDataRequestType.PlaceLien) {
        requestBody = originatingRequest.requestBody;
    }

    if (!requestBody) {
        throw AppException.BadRequest.setMessage('No request body found');
    }

    return {
        fee: requestBody.fee,
        currency: requestBody.currency,
        tran_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        message_type: 3, // 3 is for sales completion
        fip_reference: Utils.generateRandomBytes(20),
        initial_tran_reference: requestBody.fip_reference,
        card_id: requestBody.card_id,
        merchant_id: requestBody.merchant_id,
        pos_data_code: requestBody.pos_data_code,
        terminal_id: requestBody.terminal_id,
        customer_name: requestBody.customer_name,
        stan: requestBody.stan,
        card_number: requestBody.card_number,
        rrn: requestBody.rrn,
        amount: requestBody.amount,
        type: 1, // 1 is for debit
        account_identifier: requestBody.account_identifier,
        merchant_type: requestBody.merchant_type,
        merchant_name_location: requestBody.merchant_name_location,
        triggeredManually: true,
    };
}

export function createPavilionDisputeRefundRequestBody(auth: HydratedDocument<CardAuthorization>) {
    if (!auth.networkData.requests || !auth.networkData.requests[0]) {
        throw AppException.BadRequest.setMessage('No request found');
    }

    let requestBody;

    const originatingRequest = auth.networkData.requests[0];

    if (originatingRequest.type == NetworkDataRequestType.Debit) {
        requestBody = originatingRequest.requestBody;
    }

    if (originatingRequest.type == NetworkDataRequestType.PlaceLien) {
        requestBody = auth.networkData.requests[1].requestBody;
    }

    if (!requestBody) {
        throw AppException.BadRequest.setMessage('No request body found');
    }

    return {
        fee: requestBody.fee,
        currency: requestBody.currency,
        tran_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        message_type: 5, // 5 is for dispute-refund
        fip_reference: Utils.generateRandomBytes(20),
        initial_tran_reference: originatingRequest.requestBody.fip_reference,
        card_id: requestBody.card_id,
        merchant_id: requestBody.merchant_id,
        pos_data_code: requestBody.pos_data_code,
        terminal_id: requestBody.terminal_id,
        customer_name: requestBody.customer_name,
        stan: requestBody.stan,
        card_number: requestBody.card_number,
        rrn: requestBody.rrn,
        amount: requestBody.amount,
        type: 2, // 2 is for credit
        account_identifier: requestBody.account_identifier,
        merchant_type: requestBody.merchant_type,
        merchant_name_location: requestBody.merchant_name_location,
        triggeredManually: true,
    };
}

export function createPavilionReversalRequestBody(auth: HydratedDocument<CardAuthorization>) {
    if (!auth.networkData.requests || !auth.networkData.requests[0]) {
        throw AppException.BadRequest.setMessage('No request found');
    }

    let requestBody;

    const originatingRequest = auth.networkData.requests[0];
    const secondRequest = auth.networkData.requests[1];

    if (originatingRequest.type == NetworkDataRequestType.Debit) {
        requestBody = originatingRequest.requestBody;
    }

    if (originatingRequest.type == NetworkDataRequestType.PlaceLien) {
        requestBody = secondRequest ? secondRequest.requestBody : originatingRequest.requestBody;
    }

    if (!requestBody) {
        throw AppException.BadRequest.setMessage('No request body found');
    }

    return {
        fee: requestBody.fee,
        currency: requestBody.currency,
        tran_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        message_type: 4, // 4 is for reversal
        fip_reference: Utils.generateRandomBytes(20),
        initial_tran_reference: requestBody.fip_reference,
        card_id: requestBody.card_id,
        merchant_id: requestBody.merchant_id,
        pos_data_code: requestBody.pos_data_code,
        terminal_id: requestBody.terminal_id,
        customer_name: requestBody.customer_name,
        stan: requestBody.stan,
        card_number: requestBody.card_number,
        rrn: requestBody.rrn,
        amount: requestBody.amount,
        type: 2, // 2 is for credit
        account_identifier: requestBody.account_identifier,
        merchant_type: requestBody.merchant_type,
        merchant_name_location: requestBody.merchant_name_location,
        triggeredManually: true,
    };
}

export function getAuthorizationPipeline(conditions: any) {
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
            status: 1,
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

export function buildAuthorizationCVData(doc: any): CardAuthorizationCSVEntry {
    return {
        id: TagMongoId(ModelIdTag.CardAuthorization, doc._id),
        status: doc.status,
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

// check if has fund reversed timeline from a auth
export function hasFundsReversedTimeline(auth: HydratedDocument<CardAuthorization>): boolean {
    return auth.timeline.some((v) => v.action == CardAuthTimelineAction.FundsReversed);
}
