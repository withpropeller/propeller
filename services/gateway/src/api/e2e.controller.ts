import { Public } from '@common/decorators/public-request.decorator';
import { Controller, Post, Get, Param } from '@nestjs/common';

// const isTestEnv = process.env.NODE_ENV === 'test';

// TODO : Protect and use only during tests
@Controller('/e2e')
export class E2EController {
    // constructor() {}  public connection: Connection, // @Inject(REDIS_CLIENT) private readonly redis: Redis,

    @Post()
    @Public()
    async cleanup(): Promise<any> {
        /*    if (process.env.DB_ALLOW_REFRESH) {
            await this.connection.synchronize(true);
            await this.connection.runMigrations();
        } else {
            throw new NotFoundException();
        }*/
        //  await this.redis.flushdb();
    }

    @Get('last-redis-token/:type')
    // eslint-disable-next-line
    async getConfirmationToken(@Param('type') type: string): Promise<any> {
        /*  const result: string[] = await this.redis.keys('*');
        const keys = result.filter((v) => v.indexOf(type) !== -1);
        const lastKey = keys[0];
        const token = lastKey.split(':')[1];
        return { token };*/
    }
}
