/// <reference types="vite/client" />
const API_BASE = import.meta.env.VITE_OFFICE_API_URL || 'http://localhost:3003';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface Business {
  id: string;
  name: string;
  country: string;
  status: string;
  kybStatus: string;
  paykkaMerchId?: string;
  paykkaRawResponse?: Record<string, unknown>;
  sanctionsHits?: Record<string, unknown>[];
  auditTimeline?: Record<string, unknown>[];
  createdAt: string;
}

export interface ListBusinessesQuery {
  status?: string;
  kybStatus?: string;
  limit?: string;
  offset?: string;
}

export interface ApproveBusinessBody {
  action: string;
  reason?: string;
}

export const api = {
  listBusinesses: (query?: ListBusinessesQuery) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.kybStatus) params.set('kybStatus', query.kybStatus);
    if (query?.limit) params.set('limit', query.limit);
    if (query?.offset) params.set('offset', query.offset);
    const qs = params.toString();
    return fetchJson<Business[]>(`/admin/businesses${qs ? `?${qs}` : ''}`);
  },

  getBusiness: (id: string) => fetchJson<Business>(`/admin/businesses/${id}`),

  approveBusiness: (id: string, body: ApproveBusinessBody) =>
    fetchJson<Business>(`/admin/businesses/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
