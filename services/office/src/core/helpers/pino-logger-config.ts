import * as pinoHttp from 'pino-http';
import ecsFormat = require('@elastic/ecs-pino-format');
import { ConfigService } from '@config/config.service';

const REDACTION = {
    paths: [
        'data.content.token',
        'http.request.body.password',
        'http.request.body.pin',
        'http.request.body.pan',
        'http.request.body.cvv',
        'http.request.headers.authorization',
    ],
    censor: '*****',
};
const ecsFormatters = ecsFormat({ convertReqRes: true });

// https://stackoverflow.com/questions/19215042/express-logging-response-body
// https://stackoverflow.com/a/73860234/3335054
export function PinoLoggerConfig(config: ConfigService): pinoHttp.Options {
    return {
        level: config.LOG_LEVEL,
        messageKey: ecsFormatters.messageKey,
        timestamp: ecsFormatters.timestamp,
        serializers: {
            req: () => undefined,
        },
        formatters: {
            level: ecsFormatters.formatters.level,
            bindings: ecsFormatters.formatters.bindings,
            log: (obj: any) => {
                const req = obj.res?.req;
                const http = req ? { request: { body: req?.body } } : undefined;
                return ecsFormatters.formatters.log({ ...obj, req, http });
            },
        },
        redact: config.inCloud ? REDACTION : [],
        autoLogging: {
            ignore: (req) => {
                return ['/health'].some((e) => req.url.includes(e));
            },
        },
    };
}
