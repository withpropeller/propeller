/**
 * Created by EdgeTech on 12/12/2016.
 */
import { Job } from './job';

export enum MessagingChannel {
    WHATSAPP = 'WHATSAPP',
    SMS = 'SMS',
}

export class SMSJob extends Job {
    private from: string;
    private to: string;
    private template: string;
    private content: Record<string, unknown>;
    private channel: MessagingChannel;

    constructor() {
        super();
    }

    public setFrom(value: string) {
        this.from = value;
        return this;
    }

    public setTo(value: string) {
        this.to = value;
        return this;
    }

    public setTemplate(value: string) {
        this.template = value;
        return this;
    }

    public setContent(content: Record<string, unknown>) {
        this.content = content;
        return this;
    }

    public setChannel(channel: MessagingChannel) {
        this.channel = channel;
        return this;
    }
}
