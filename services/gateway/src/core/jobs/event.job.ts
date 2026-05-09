import { Job } from './job';


export class EventJob extends Job {
    private name: string;
    private object: string;
    private metadata: Record<string, unknown>;

    constructor() {
        super();
    }

    public setName(value: string) {
        this.name = value;
        return this;
    }

    public setObject(value: string) {
        this.object = value;
        return this;
    }

    public setMetadata(metadata: Record<string, unknown>) {
        this.metadata = metadata;
        return this;
    }
}
