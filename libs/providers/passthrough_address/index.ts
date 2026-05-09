import type {
    AddressScreeningProvider,
    AddressScreeningRequest,
    AddressScreeningResult,
    ProviderInitOptions,
} from '../../contracts/providers.js';

export class PassthroughAddressScreeningProvider implements AddressScreeningProvider {
    readonly name = 'passthrough_address';

    constructor(_opts: ProviderInitOptions) { }

    async healthcheck(): Promise<boolean> {
        return true;
    }

    async screenAddress(req: AddressScreeningRequest): Promise<AddressScreeningResult> {
        return {
            provider: this.name,
            decision: 'unscreened',
            raw: {
                address: req.address,
                city: req.city ?? null,
                country: req.country,
                postal_code: req.postal_code ?? null,
            },
            screened_at: new Date().toISOString(),
        };
    }
}
