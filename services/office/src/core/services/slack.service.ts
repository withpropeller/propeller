import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@config/config.service';
import { SlackMessage } from '@core/interfaces/slack-message.interface';

@Injectable()
export class SlackService {
    constructor(private http: HttpService, readonly config: ConfigService) {}

    async pushErrorToSlack(data: SlackMessage) {
        const dataBlock = [
            {
                type: 'section',
                text: { type: 'mrkdwn', text: `*New Report: Error*` },
                fields: Object.entries(data).map(([key, value]) => {
                    return {
                        type: 'mrkdwn',
                        text: `*${key}*: \ ${value}`,
                    };
                }),
            },
        ];
        await this.pushMessageToChannel(dataBlock);
    }

    async pushInfoToSlack(data: SlackMessage) {
        const dataBlock = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Notification Type: Info* \n> ${data.message}`,
                },
            },
        ];
        await this.pushMessageToChannel(dataBlock);
    }

    async pushMessageToChannel(dataBlock: Array<Record<string, unknown>> = []) {
        const token = this.config.SLACK_TOKEN;
        const slackChannel = this.config.SLACK_EVENTS_CHANNEL;

        const payload = {
            channel: slackChannel,
            blocks: dataBlock,
            username: 'Allawee Reporter',
            icon_emoji: ':+1:',
        };

        await this.http
            .post('https://slack.com/api/chat.postMessage', payload, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            })
            .toPromise();
    }
}
