import { ConflictException } from '@nestjs/common';

export class EmailConflictException extends ConflictException {
    constructor() {
        super('Email already in use.');
    }
}
