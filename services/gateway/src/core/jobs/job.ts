import { Utils } from '../helpers/utils';

export abstract class Job {
    protected id: string;

    constructor() {
        this.id = Utils.generateRandomID(16);
    }

    public getId() {
        return this.id;
    }
}
