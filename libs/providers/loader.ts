// ──────────────────────────────────────────────────────────────
// Provider Loader — reads env, instantiates configured providers
// ──────────────────────────────────────────────────────────────
// Adding a new provider = add an env var + drop a lib in libs/providers/<name>
// No code changes in apps/workers.
// ──────────────────────────────────────────────────────────────

import type { ProviderAdapter, ProviderInitOptions, ProviderRegistry, ProviderType, VirtualAccountProvider, MerchantKybProvider, CustomerKycProvider, OffRampProvider, AddressScreeningProvider, SanctionsScreeningProvider } from '../../contracts/providers.js';

export interface ProviderLoaderOptions {
  /** Provider configuration map (secrets + non-secrets). In production this comes from Rune secrets. */
  config: Record<string, string>;
  /** Optional: override which providers are enabled (defaults to env vars). */
  enabled?: Partial<Record<ProviderType, boolean>>;
}

export interface LoadedProviders {
  paystack?: VirtualAccountProvider;
  paykka?: MerchantKybProvider;
  dojah?: CustomerKycProvider;
  globalstack?: OffRampProvider;
  passthrough_address?: AddressScreeningProvider;
  complyadvantage?: SanctionsScreeningProvider;
  /** All loaded provider instances indexed by name. */
  all: ProviderAdapter[];
}

/**
 * Load all configured provider adapters from env.
 *
 * Each provider is enabled via PROVIDER_<NAME>_ENABLED=true in env.
 * Secrets come from Rune in deployed envs, or .env.local in dev.
 */
export async function loadProviders(opts: ProviderLoaderOptions): Promise<LoadedProviders> {
  const result: LoadedProviders = { all: [] };
  const initOpts: ProviderInitOptions = { config: opts.config };

  const isEnabled = (type: ProviderType): boolean => {
    if (opts.enabled?.[type] !== undefined) return opts.enabled[type];
    const envKey = `PROVIDER_${type.toUpperCase()}_ENABLED`;
    return opts.config[envKey] === 'true';
  };

  // Paystack
  if (isEnabled('paystack')) {
    const { PaystackProvider } = await import('../paystack/index.js');
    const p = new PaystackProvider(initOpts);
    result.paystack = p;
    result.all.push(p);
  }

  // PayKKa
  if (isEnabled('paykka')) {
    const { PayKKaProvider } = await import('../paykka/index.js');
    const p = new PayKKaProvider(initOpts);
    result.paykka = p;
    result.all.push(p);
  }

  // Dojah
  if (isEnabled('dojah')) {
    const { DojahProvider } = await import('../dojah/index.js');
    const p = new DojahProvider(initOpts);
    result.dojah = p;
    result.all.push(p);
  }

  // Globalstack
  if (isEnabled('globalstack')) {
    const { GlobalstackProvider } = await import('../globalstack/index.js');
    const p = new GlobalstackProvider(initOpts);
    result.globalstack = p;
    result.all.push(p);
  }

  // Passthrough Address (always loads — no external dependency)
  if (isEnabled('passthrough_address')) {
    const { PassthroughAddressScreeningProvider } = await import('../passthrough_address/index.js');
    const p = new PassthroughAddressScreeningProvider(initOpts);
    result.passthrough_address = p;
    result.all.push(p);
  }

  // ComplyAdvantage
  if (isEnabled('complyadvantage')) {
    const { ComplyAdvantageProvider } = await import('../complyadvantage/index.js');
    const p = new ComplyAdvantageProvider(initOpts);
    result.complyadvantage = p;
    result.all.push(p);
  }

  return result;
}
