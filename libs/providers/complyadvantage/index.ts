// ──────────────────────────────────────────────────────────────
// ComplyAdvantage Provider Adapter — Sanctions Screening
// ──────────────────────────────────────────────────────────────
// Implements SanctionsScreeningProvider for ComplyAdvantage's
// AML / sanctions screening API.
//
// Auth: API key in Authorization header (Bearer token)
// Endpoints:
//   POST /v1/searches — create a screening search
//   GET  /v1/searches/:id — get search results
// ──────────────────────────────────────────────────────────────

import type {
  ProviderInitOptions,
  ProviderAdapter,
  ScreeningEntity,
  ScreeningRequest,
  ScreeningResult,
  ScreeningHit,
  SanctionsScreeningProvider,
} from '../../contracts/providers.js';
import { BaseProviderClient, ProviderAuthError } from '../_shared/index.js';

// ── Types ──

interface CASearchRequest {
  search_term: string;
  fuzziness?: number;
  filters?: {
    birth_date?: string[];
    country_codes?: string[];
    entity_type?: string;
  };
}

interface CASearchResponse {
  id: string;
  status: string;
  search_term: string;
}

interface CAHit {
  id: string;
  name: string;
  score: number;
  match_types: string[];
  lists: string[];
  entity_type: string;
  countries?: string[];
  raw_data?: Record&lt;string, unknown&gt;;
}

interface CAResultResponse {
  id: string;
  status: string;
  search_term: string;
  hits: CAHit[];
}

// ── Provider ──

export class ComplyAdvantageProvider extends BaseProviderClient implements SanctionsScreeningProvider {
  private readonly apiKey: string;
  private readonly defaultThreshold: number;

  constructor(opts: ProviderInitOptions) {
    const baseUrl = opts.config.COMPLYADVANTAGE_BASE_URL ?? 'https://api.complyadvantage.com';
    const apiKey = opts.config.COMPLYADVANTAGE_API_KEY;

    if (!apiKey) throw new ProviderAuthError('complyadvantage', 'COMPLYADVANTAGE_API_KEY not set');

    super('complyadvantage', {
      baseUrl,
      timeoutMs: 30_000,
    });

    this.apiKey = apiKey;
    this.defaultThreshold = Number(opts.config.COMPLYADVANTAGE_THRESHOLD ?? '70');
  }
    screen(req: ScreeningRequest): Promise<ScreeningResult> {
        throw new Error('Method not implemented.');
    }
    screenEntity(entity: ScreeningEntity, threshold?: number): Promise<ScreeningResult> {
        throw new Error('Method not implemented.');
    }

  // ── ProviderAdapter ──

  async healthcheck(): Promise&lt;boolean&gt; {
    try {
      const resp = await this.request('GET', '/v1/searches?limit=1');
      return resp.status === 200;
    } catch {
      return false;
    }
  }

  // ── SanctionsScreeningProvider ──

  async screen(req: ScreeningRequest): Promise&lt;ScreeningResult&gt; {
    const threshold = req.threshold ?? this.defaultThreshold;
    const allHits: ScreeningHit[] = [];

    for (const entity of req.entities) {
      const result = await this.screenEntity(entity, threshold);
      allHits.push(...result.hits);
    }

    const maxRisk = allHits.length &gt; 0 ? Math.max(...allHits.map((h) =&gt; h.riskScore)) : 0;
    const decision = maxRisk &gt;= threshold ? 'flagged' : allHits.length &gt; 0 ? 'cleared' : 'unscreened';

    return {
      decision,
      riskScore: maxRisk,
      threshold,
      hits: allHits,
      screenedAt: new Date().toISOString(),
      provider: 'complyadvantage',
    };
  }

  async screenEntity(entity: ScreeningEntity, threshold?: number): Promise&lt;ScreeningResult&gt; {
    const effectiveThreshold = threshold ?? this.defaultThreshold;

    // 1. Create search
    const searchReq: CASearchRequest = {
      search_term: entity.name,
      fuzziness: 0.6,
      filters: {
        entity_type: entity.type === 'company' ? 'organisation' : 'person',
      },
    };

    if (entity.birthDate) {
      searchReq.filters = searchReq.filters ?? {};
      searchReq.filters.birth_date = [entity.birthDate];
    }
    if (entity.nationality) {
      searchReq.filters = searchReq.filters ?? {};
      searchReq.filters.country_codes = [entity.nationality];
    }

    const searchResp = await this.request('POST', '/v1/searches', searchReq, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (searchResp.status !== 201 &amp;&amp; searchResp.status !== 200) {
      throw new Error(`ComplyAdvantage search failed: ${searchResp.status} ${JSON.stringify(searchResp.data)}`);
    }

    const searchData = searchResp.data as CASearchResponse;

    // 2. Poll for results (with timeout)
    const result = await this.pollForResults(searchData.id, 10_000);

    // 3. Map to ScreeningResult
    const hits: ScreeningHit[] = (result.hits ?? []).map((hit) =&gt; ({
      id: hit.id,
      name: hit.name,
      riskScore: hit.score,
      lists: hit.lists ?? [],
      matchTypes: hit.match_types ?? [],
      raw: hit.raw_data ?? {},
    }));

    const maxRisk = hits.length &gt; 0 ? Math.max(...hits.map((h) =&gt; h.riskScore)) : 0;
    const decision = maxRisk &gt;= effectiveThreshold ? 'flagged' : hits.length &gt; 0 ? 'cleared' : 'unscreened';

    return {
      decision,
      riskScore: maxRisk,
      threshold: effectiveThreshold,
      hits,
      screenedAt: new Date().toISOString(),
      provider: 'complyadvantage',
    };
  }

  // ── Internal helpers ──

  private async pollForResults(searchId: string, timeoutMs: number): Promise&lt;CAResultResponse&gt; {
    const start = Date.now();
    const pollInterval = 500;

    while (Date.now() - start &lt; timeoutMs) {
      const resp = await this.request('GET', `/v1/searches/${searchId}`, undefined, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (resp.status === 200) {
        const data = resp.data as CAResultResponse;
        if (data.status === 'completed' || data.hits) {
          return data;
        }
      }

      await new Promise((resolve) =&gt; setTimeout(resolve, pollInterval));
    }

    throw new Error(`ComplyAdvantage search ${searchId} timed out after ${timeoutMs}ms`);
  }
}
