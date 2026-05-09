import { Injectable } from '@nestjs/common';
import { Client, RedisHashData, RedisJsonData } from 'redis-om';
import { ConfigService } from '@config/config.service';
import { APIPagingData, APIPagingDto } from '@common/api-paging';
import { RedisAPIPaging } from '@common/api-paging/redis-api-paging';

const ContentMatchDelSha = '092707c3bf586b9bde7d67423d5f1320b3f02205';

@Injectable()
export class RedisService {
    private client: Client;
    constructor(private config: ConfigService) {}

    async onModuleInit() {
        this.client = await new Client().open(this.config.REDIS_URI);
    }

    isOpen(): boolean {
        return this.client.isOpen();
    }

    async exists(key: string): Promise<boolean> {
        return this.client.execute(['EXISTS', key]) as Promise<boolean>;
    }

    async set(key: string, value: string) {
        return this.client.set(key, value);
    }

    async setNx(key: string, value: string, seconds: number) {
        return this.client.execute(['SET', key, value, 'NX', 'EX', seconds]);
    }

    async get(key: string): Promise<string> {
        return this.client.get(key);
    }

    async delete(key: string): Promise<any> {
        return this.client.unlink(key);
    }

    async jsonSet(key: string, value: RedisJsonData) {
        return this.client.jsonset(key, value);
    }

    async jsonDeletePath(key: string, path: string) {
        return this.client.execute(['JSON.DEL', key, path]);
    }

    async jsonGet<T>(key: string): Promise<T> {
        return this.client.jsonget(key) as Promise<T>;
    }

    async hashSetAll(key: string, data: RedisHashData) {
        return this.client.hsetall(key, data);
    }

    async hashGetAll(key: string) {
        return this.client.hgetall(key);
    }

    async hashDelete(key: string, field: string) {
        return this.client.execute(['HDEL', key, field]);
    }

    async hashSet(key: string, field: string, value: string) {
        return this.client.execute(['HSET', key, field, value]);
    }

    async contentMatchDel(key: string, content: string) {
        return this.evalSha(ContentMatchDelSha, key, [content]);
    }

    async timeSeriesCreate(key: string, keyValue: Record<string, string>) {
        const labels = Object.entries(keyValue).flat();
        return this.client.execute(['TS.CREATE', key, 'LABELS', ...labels]);
    }

    async timeSeriesAdd(key: string, value: number, timestamp = '*') {
        return this.client.execute(['TS.ADD', key, timestamp, value]);
    }

    async timeSeriesGet(key: string): Promise<string[]> {
        return this.client.execute(['TS.GET', key]) as Promise<string[]>;
    }

    async timeSeriesFilter(keyValue: Record<string, string>): Promise<string[]> {
        const filter = Object.entries(keyValue).map((v) => v[0] + '=' + v[1]);
        return this.client.execute(['TS.MGET', 'WITHLABELS', 'FILTER', ...filter]) as Promise<string[]>;
    }

    async increment(key: string): Promise<number> {
        return this.client.execute(['INCR', key]) as Promise<number>;
    }

    async beginTransaction() {
        return this.client.execute(['MULTI']);
    }

    async execTransaction() {
        return this.client.execute(['EXEC']);
    }

    async expire(key: string, seconds: number) {
        return this.client.execute(['EXPIRE', key, seconds]);
    }

    async evalSha(sha: string, keys: string | string[], args: Record<string, any>) {
        const argsArr = Object.entries(args).flat();
        const keyArr = Array.isArray(keys) ? keys : [keys];
        return this.client.execute(['EVALSHA', sha, keyArr.length, ...keyArr, ...argsArr]);
    }

    async search<T>(index: any, query: string, paging: APIPagingDto): Promise<APIPagingData<T>> {
        const { limit, sort } = RedisAPIPaging.getPagingConstraints(paging);
        let totalCount;

        const raw = (await this.client.execute(['FT.SEARCH', index, query, ...limit, ...sort])) as any[];
        const results = raw.filter((v) => Array.isArray(v)).map((v) => JSON.parse(v.at(-1)));
        const hasMore = results.length > paging.limit;
        if (results.length > limit[2]) results.pop();

        if (paging.countTotal) {
            totalCount = (await this.client.execute(['FT.SEARCH', index, query, 'LIMIT', 0, 0, 'COUNT', 1])) as any[];
        }

        return {
            data: results,
            metadata: {
                hasMore,
                totalCount,
            },
        };
    }

    async addToStream(key: string, keyValue: Record<string, any>, id = '*'): Promise<string> {
        const fieldValues = Object.entries(keyValue).flat();
        return this.client.execute(['XADD', key, id, ...fieldValues]) as Promise<string>;
    }

    async readOneFromStream(key: string, timeout: number, id = '$'): Promise<Record<string, string>> {
        const res = (await this.client.execute([
            'XREAD',
            'COUNT',
            '1',
            'BLOCK',
            timeout,
            'STREAMS',
            key,
            id,
        ])) as Promise<string>;
        if (!res) return null;

        const arr: string[] = res[0][1][0][1];

        const newArr = [];
        while (arr.length) newArr.push(arr.splice(0, 2));

        return Object.fromEntries(newArr);
    }

    async sMembers(key: string): Promise<string[]> {
        return this.client.execute(['SMEMBERS', key]) as Promise<string[]>;
    }

    async sRem(key: string, members: string[]) {
        return this.client.execute(['SREM', key, ...members]);
    }
}
