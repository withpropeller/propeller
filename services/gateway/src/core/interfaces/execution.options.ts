import { ClientSession } from 'mongoose';

export interface ExecutionOptions {
    dryRun?: boolean;
    session?: ClientSession;
}
