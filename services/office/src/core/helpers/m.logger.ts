import { Logger } from '@nestjs/common';

export class MLogger extends Logger {
    log(message: string, context?: string): void {
        Logger.log(message, context);
    }

    error(message: string, trace: string, context?: string): void {
        Logger.error(message, trace, context);
    }

    warn(message: string, context?: string): void {
        Logger.warn(message, context);
    }
}
