import { HttpStatus } from '@nestjs/common';
import { CustomException } from '@core/exceptions/custom-exception';
import { MongoErrors } from './mongo.enums';
import { AppStatus } from '@core/helpers';

export class MongoException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNAUTHORIZED,
        message = 'Mongo Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get Conflict() {
        return new this(MongoErrors.Conflict, 'Conflict', HttpStatus.CONFLICT);
    }

    public static EntityNotInActiveState(collectionName: string, activeString: string) {
        return new this(AppStatus.BadRequest, `${collectionName} not in ${activeString} state`, HttpStatus.BAD_REQUEST);
    }

    public static EntityNotFound(collectionName: string) {
        return new this(`${collectionName} not found`, MongoErrors.NotFound, HttpStatus.NOT_FOUND);
    }

    public static get AtlasError() {
        return new this('Service Unavailable', AppStatus.ServiceUnavailable, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public static get LedgerError() {
        return new this('Ledger Error', AppStatus.ServiceUnavailable, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public static InvalidObjectId() {
        return new this('Invalid ObjectId', MongoErrors.InvalidObjectId, HttpStatus.BAD_REQUEST);
    }
}

export class MongoExceptionConflict extends CustomException {
    constructor() {
        super(null, 'mongo-exception-conflict', HttpStatus.CONFLICT, 'Mongo Exception Conflict');
    }
}
