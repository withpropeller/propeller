import { Module, OnModuleInit } from '@nestjs/common';
import { AssembleClient } from './assemble.client';

@Module({
    imports: [],
    providers: [AssembleClient],
    exports: [AssembleClient],
})
export class AssembleModule implements OnModuleInit {
    constructor(private service: AssembleClient) {}

    async onModuleInit() {
        await this.service.register('backend.service');
    }
}
