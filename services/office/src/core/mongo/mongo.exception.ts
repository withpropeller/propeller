/*
 * @license
 * Copyright (c) 2020. KolaCredit
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import { HttpStatus } from '@nestjs/common';
import { CustomException } from '@core/exceptions/custom-exception';
import { MongoErrors } from './mongo.enums';
import { AppStatus } from '@core/helpers';

export class MongoException extends CustomException {
    constructor(
        err: any,
        code: string,
        message = 'Mongo Exception',
        status: number = HttpStatus.UNAUTHORIZED,
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get Conflict() {
        return new this(null, 'Conflict', MongoErrors.Conflict, HttpStatus.CONFLICT);
    }

    public static get NotFound() {
        return new this(null, 'NotFound', MongoErrors.NotFound, HttpStatus.NOT_FOUND);
    }

    public static EntityNotInActiveState(collectionName: string, activeString: string) {
        return new this(
            null,
            `${collectionName} not in ${activeString} state`,
            AppStatus.BadRequest,
            HttpStatus.BAD_REQUEST,
        );
    }

    public static EntityNotFound(collectionName: string) {
        return new this(null, `${collectionName} not found`, MongoErrors.NotFound, HttpStatus.NOT_FOUND);
    }

    public static get AtlasError() {
        return new this(null, 'Service Unavailable', AppStatus.ServiceUnavailable, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public static get LedgerError() {
        return new this(null, 'Ledger Error', AppStatus.ServiceUnavailable, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export class MongoExceptionConflict extends CustomException {
    constructor() {
        super(null, 'mongo-exception-conflict', HttpStatus.CONFLICT, 'Mongo Exception Conflict');
    }
}
