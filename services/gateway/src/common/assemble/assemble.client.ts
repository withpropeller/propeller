import { Injectable } from '@nestjs/common';

@Injectable()
export class AssembleClient {
    /**
     * Register the service on assemble
     * Loads app configs/secrets into memory per environment
     * @param service
     */
    register(service: string) {}

    fetchConfig(key: string) {}

    dispatchConfig(key: string) {}

    updateConfig(key: string) {}

    deregister(service: string) {}
}
