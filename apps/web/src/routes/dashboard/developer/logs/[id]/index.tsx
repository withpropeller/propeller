'use client'

import Link from '@/lib/routing'
import { useParams } from '@/lib/routing'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Skeleton, Chip } from '@/lib/pax'
import { useApiRequestsControllerGetOne } from '@/api/requests/requests'
import { type ApiHydratedApiRequest } from '@/api/model'
import { CopyButton } from '@/components/ui/CopyButton'
import { Badge } from '@/components/ui/Badge'
import { formatDatetime } from '@/lib/format'

// ── JSON highlighter ──────────────────────────────────────────────────────────
function highlight(json: unknown): string {
  if (json == null) return ''
  let str: string
  try { str = typeof json === 'string' ? json : JSON.stringify(json, null, 2) }
  catch { str = String(json) }
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span class="text-sky-400">${match}</span>`
          return `<span class="text-emerald-400">${match}</span>`
        }
        if (/true|false/.test(match)) return `<span class="text-yellow-400">${match}</span>`
        if (/null/.test(match))       return `<span class="text-rose-400">${match}</span>`
        return `<span class="text-purple-400">${match}</span>`
      },
    )
}

// ── Chips ─────────────────────────────────────────────────────────────────────
const CHIP_OVERRIDES: Record<string, string> = {
  success:     '!bg-feedback-success-light !border-feedback-success-border !text-feedback-success-dark',
  error:       '!bg-feedback-danger-light !border-feedback-danger-border !text-feedback-danger-main',
  information: '!bg-feedback-information-light !border-feedback-information-border !text-feedback-information-dark',
}

function statusColor(status: string) {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'error'
  return 'secondary'
}

function StatusChip({ status }: { status: string }) {
  const color = statusColor(status)
  return (
    <Chip variant="status" color={color as any} className={CHIP_OVERRIDES[color] ?? ''}>
      {status}
    </Chip>
  )
}

function MethodChip({ method }: { method: string }) {
  const isPost = method?.toUpperCase() === 'POST'
  const color = isPost ? 'information' : 'secondary'
  return (
    <Chip variant="status" color={color as any} className={CHIP_OVERRIDES[color] ?? ''}>
      {method?.toUpperCase()}
    </Chip>
  )
}

// ── Detail rows ───────────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border-primary-light last:border-0">
      <span className="text-xs font-medium text-content-tertiary shrink-0 pt-0.5">{label}</span>
      <div className="text-sm text-content-primary text-right">{children}</div>
    </div>
  )
}

export default function ApiLogDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, error } = useApiRequestsControllerGetOne(id)
  const log: ApiHydratedApiRequest | undefined = (data?.data as any)

  const hasQuery    = log?.query && Object.keys(log.query).length > 0
  const hasBody     = log?.requestBody && Object.keys(log.requestBody).length > 0
  const hasSource   = !!(log?.source)
  const hasEvents   = (log?.events?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-content-tertiary">
        <Link href="/dashboard/developer/logs" className="hover:text-content-primary transition-colors">
          API Logs
        </Link>
        <ChevronRight width={12} height={12} />
        <span className="font-mono text-content-secondary">{id}</span>
      </div>

      {/* Back + title */}
      <div>
        <Link
          href="/dashboard/developer/logs"
          className="group mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-content-tertiary hover:text-content-primary transition-colors"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to API Logs
        </Link>
        {isLoading ? (
          <Skeleton className="h-8 w-64 mt-1" />
        ) : (
          <h1 className="text-2xl font-bold text-content-primary tracking-tight font-mono">
            {log?.method?.toUpperCase()} {log?.path}
          </h1>
        )}
      </div>

      {error ? (
        <p className="text-sm text-feedback-danger-main">Failed to load request log.</p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-surface-primary border border-border-primary-light rounded-xl p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : log ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

          {/* Left: main info */}
          <div className="md:col-span-2 space-y-6">

            {/* Overview */}
            <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-primary-light">
                <h2 className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Request Overview</h2>
              </div>
              <div className="px-5 divide-y divide-border-primary-light">
                <Row label="ID">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs">{log.id}</span>
                    <CopyButton text={log.id} />
                  </div>
                </Row>
                <Row label="Method"><MethodChip method={log.method} /></Row>
                <Row label="Path">
                  <span className="font-mono text-xs">{log.path}</span>
                </Row>
                <Row label="Status"><StatusChip status={log.status} /></Row>
                <Row label="API Version">
                  <span className="text-xs font-mono bg-surface-secondary border border-border-primary-light px-2 py-0.5 rounded">
                    {log.apiVersion ?? '—'}
                  </span>
                </Row>
                <Row label="Created">{formatDatetime(log.createdAt)}</Row>
                {log.secretKey && (
                  <Row label="Secret Key">
                    <span className="font-mono text-xs text-content-quaternary">{log.secretKey}</span>
                  </Row>
                )}
                {log.initiator && (
                  <Row label="Initiator">
                    <span className="font-mono text-xs text-content-quaternary">{log.initiator}</span>
                  </Row>
                )}
              </div>
            </div>

            {/* Query params */}
            {hasQuery && (
              <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-primary-light">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Query Parameters</h2>
                </div>
                <pre
                  className="px-5 py-4 text-xs font-mono bg-[#0f1117] text-content-primary overflow-x-auto leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlight(log.query) }}
                />
              </div>
            )}

            {/* Request body */}
            {hasBody && (
              <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-primary-light">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Request Body</h2>
                </div>
                <pre
                  className="px-5 py-4 text-xs font-mono bg-[#0f1117] text-content-primary overflow-x-auto leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlight(log.requestBody) }}
                />
              </div>
            )}

            {/* Linked events */}
            {hasEvents && (
              <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-primary-light">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Linked Events</h2>
                </div>
                <div className="divide-y divide-border-primary-light">
                  {log.events!.map((eventId) => (
                    <div key={eventId} className="px-5 py-3 flex items-center justify-between">
                      <span className="font-mono text-xs text-content-secondary">{eventId}</span>
                      <Link
                        href={`/dashboard/developer/events/${eventId}`}
                        className="text-xs font-medium text-action-primary-main hover:underline"
                      >
                        View event →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: source info */}
          <div className="space-y-6">
            {hasSource && (
              <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-primary-light">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Source</h2>
                </div>
                <div className="px-5 divide-y divide-border-primary-light">
                  {log.source!.ipAddress && (
                    <Row label="IP Address">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{log.source!.ipAddress}</span>
                        <CopyButton text={log.source!.ipAddress} />
                      </div>
                    </Row>
                  )}
                  {(log.source!.client as any)?.name && (
                    <Row label="Client">{String((log.source!.client as any).name)}</Row>
                  )}
                  {(log.source!.os as any)?.name && (
                    <Row label="OS">{String((log.source!.os as any).name)}</Row>
                  )}
                  {log.source!.device && (
                    <Row label="Device">{(log.source!.device as any).name ?? '—'}</Row>
                  )}
                  {log.source!.location && (
                    <Row label="Location">
                      {[(log.source!.location as any).city, (log.source!.location as any).country]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </Row>
                  )}
                </div>
              </div>
            )}

            {log.proxySource && (
              <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-primary-light">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Proxy Source</h2>
                </div>
                <div className="px-5 divide-y divide-border-primary-light">
                  {log.proxySource.ipAddress && (
                    <Row label="IP Address">
                      <span className="font-mono text-xs">{log.proxySource.ipAddress}</span>
                    </Row>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      ) : null}
    </div>
  )
}
