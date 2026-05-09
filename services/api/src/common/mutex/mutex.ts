import { Utils } from '@core/helpers';
import { FloService, floEncode, floDecodeStr } from '@core/services/flo.service';
import { Logger } from '@nestjs/common';

const mutexKeyPrefix = 'assemble:data:mutex:';
const mutexStreamPrefix = 'assemble:stream:mutex:';
const defaultMutexTTL = 30; // seconds
const defaultMutexStreamExpire = 1; // seconds
const defaultWaitPeriod = 5 * 1000; // milliseconds

interface Mutex {
    lock(key: string, waitCount: number): Promise<void>;
    unlock(): Promise<void>;
    hasLock(key: string): Promise<boolean>;
    wait(): Promise<boolean>;
    notifyUnlock(): Promise<void>;
}

class MutexImpl implements Mutex {
    private key: string;
    private random: string;
    private readonly logger = new Logger(MutexImpl.name);

    constructor(private readonly flo: FloService) {}

    async lock(key: string, waitCount = 0) {
        this.key = mutexKeyPrefix + key;
        this.random = Utils.generateRandom(32);

        try {
            await this.flo.client.kv.put(this.key, floEncode(this.random), {
                ttlSeconds: BigInt(defaultMutexTTL),
                ifNotExists: true,
            });
            // success — we own the lock
            return;
        } catch {
            // key already exists — someone else holds the lock
        }

        this.logger.debug(`could not lock ${key}, waiting for lock, count: ${waitCount}`);

        if (waitCount < 6) {
            await this.wait();
            await this.lock(key, waitCount + 1);
        } else {
            throw new Error('could not acquire lock');
        }
    }

    async unlock() {
        if (this.key == '') {
            throw new Error('no key to unlock');
        }

        // CAS-based safe unlock: only clear the key if our token still
        // matches.  Flo delete doesn't support casVersion, so we atomically
        // overwrite with an empty marker via CAS, then delete unconditionally.
        const r = await this.flo.client.kv.get(this.key);
        if (!r) return;

        if (floDecodeStr(r.value) === this.random) {
            try {
                await this.flo.client.kv.put(this.key, floEncode(''), {
                    casVersion: r.version,
                });
            } catch {
                // CAS failed — someone else took the lock. Safe to ignore.
                return;
            }
            await this.flo.client.kv.delete(this.key);
        }

        await this.notifyUnlock();
    }

    async hasLock(key: string) {
        return this.flo.client.kv.exists(mutexKeyPrefix + key);
    }

    async wait() {
        const stream = mutexStreamPrefix + this.key;
        const group = `mutex:${stream}`;
        const consumer = `waiter`;

        try {
            await this.flo.client.stream.groupJoin(stream, group, consumer);
        } catch {
            // already joined
        }

        const result = await this.flo.client.stream.groupRead(stream, {
            group,
            consumer,
            limit: 1,
            blockMs: defaultWaitPeriod,
        } as any);

        if (!result.records?.length) return false;

        const rec = result.records[0];
        await this.flo.client.stream.groupAck(stream, [rec.id], { group } as any);
        return true;
    }

    async notifyUnlock() {
        const stream = mutexStreamPrefix + this.key;
        await this.flo.client.stream.append(
            stream,
            floEncode({ type: 'unlocked' }),
        );

        // Expire the stream
        try {
            await this.flo.client.kv.touch(stream, BigInt(defaultMutexStreamExpire));
        } catch { /* may not exist yet — ok */ }
    }
}

export const NewMutex = (flo: FloService) => new MutexImpl(flo);

