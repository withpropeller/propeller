import { Utils } from '@core/helpers';
import { RedisService } from '@core/services/redis.service';
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

    constructor(private readonly redis: RedisService) {}

    async lock(key: string, waitCount = 0) {
        this.key = mutexKeyPrefix + key;
        this.random = Utils.generateRandom(32);
        const locked = await this.redis.setNx(this.key, this.random, defaultMutexTTL);

        if (!locked) {
            this.logger.debug(`could not lock ${key}, waiting for lock, count: ${waitCount}`);
            await this.wait();

            if (waitCount < 6) {
                waitCount++;
                await this.lock(key, waitCount);
            } else {
                throw new Error('could not acquire lock');
            }
        }
    }

    async unlock() {
        if (this.key == '') {
            throw new Error('no key to unlock');
        }

        await this.redis.contentMatchDel(this.key, this.random);

        await this.notifyUnlock();
    }

    async hasLock(key: string) {
        return this.redis.exists(mutexKeyPrefix + key);
    }

    async wait() {
        const stream = mutexStreamPrefix + this.key;
        const res = await this.redis.readOneFromStream(stream, defaultWaitPeriod, '0-0');
        return !!res;
    }

    async notifyUnlock() {
        const stream = mutexStreamPrefix + this.key;
        const args = {
            type: 'unlocked',
        };

        await this.redis.addToStream(stream, args);

        // expire the stream
        await this.redis.expire(stream, defaultMutexStreamExpire);
    }
}

export const NewMutex = (redis: RedisService) => new MutexImpl(redis);
