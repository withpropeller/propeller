import { ConflictException } from '@nestjs/common';

export class PhoneConflictException extends ConflictException {
    constructor() {
        super('Phone already in use.');
    }
}
