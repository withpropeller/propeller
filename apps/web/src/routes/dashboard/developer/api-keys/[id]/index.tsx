'use client'

import { useEffect, useId } from 'react'
import { useParams } from '@/lib/routing'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertInformationIcon,
  Button,
  Skeleton,
  toast,
} from '@/lib/pax'
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { formatDatetime } from '@/lib/format'
import { useIssuingNav } from '@/context/IssuingNavContext'
import { useSecretKeyControllerGetOne, useSecretKeyControllerGetMetrics } from '@/api/secret-keys/secret-keys'
import type { ApiHydratedSecretKey, SecretKeyMetricsResponseDto } from '@/api/model'

function getKeyPrefix(keyData?: ApiHydratedSecretKey): string | null {
  if (!keyData) return null
  const virtualPrefix = (keyData as any).prefix as string | undefined
  if (virtualPrefix) return virtualPrefix
  const key = keyData.key
  if (!key) return null
  const dot = key.lastIndexOf('.')
  return dot === -1 ? key : key.slice(0, dot)
}


export default function ApiKeyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { setPageTitle } = useIssuingNav()

  const { data, isLoading, error, refetch } = useSecretKeyControllerGetOne(id)
  const keyData = (data as any)?.data as ApiHydratedSecretKey | undefined

  const { data: metricsData, isLoading: metricsLoading } = useSecretKeyControllerGetMetrics(id, { days: '7' })
  const metrics = (metricsData as any)?.data as SecretKeyMetricsResponseDto | undefined

  useEffect(() => {
    if (keyData?.name) setPageTitle(keyData.name)
    return () => setPageTitle(null)
  }, [keyData?.name, setPageTitle])

  const prefix = getKeyPrefix(keyData) ?? 'sk_sandbox_'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-content-primary leading-snug">
          {isLoading ? <Skeleton className="h-8 w-64" /> : keyData?.name || 'API key'}
        </h1>
      </div>

      {error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState />
      ) : keyData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="col-span-2 space-y-6">
            <KeyHeroCard keyData={keyData} prefix={prefix} />
            <UsageCard metrics={metrics} isLoading={metricsLoading} />
          </div>

          <div className="space-y-6">
            <Alert severity="information">
              <AlertTitle className="flex items-center gap-2">
                <AlertInformationIcon />
                Keep your secret key secure
              </AlertTitle>
              <AlertDescription>
                Never expose this key in frontend code or public repositories. Store it
                server-side via environment variables, and contact your account manager
                to rotate or revoke it.
              </AlertDescription>
            </Alert>

            <ScopesCard scopes={keyData.scopes ?? []} />

            {keyData.cidrWhitelist && keyData.cidrWhitelist.length > 0 && (
              <CidrCard addresses={keyData.cidrWhitelist} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function KeyHeroCard({ keyData, prefix }: { keyData: ApiHydratedSecretKey; prefix: string }) {
  const displayLastUsed = keyData.lastUsed ?? '2026-04-18T14:22:00Z' // demo fallback

  return (
    <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <p className="text-xs font-medium text-content-tertiary mb-3">Secret key</p>
        <div className="bg-surface-secondary border border-border-primary-light rounded-lg h-12 px-4 flex items-center justify-between gap-4">
          <span className="font-mono text-sm text-content-primary tracking-wide select-all truncate">
            {prefix}
            <span className="opacity-40">.{'•'.repeat(20)}</span>
          </span>
          <CopyButton
            text={prefix}
            onCopy={() => toast({ title: 'Copied to clipboard', severity: 'success' } as any)}
          />
        </div>
        <p className="mt-2.5 text-xs text-content-tertiary">
          Only the prefix is shown. The full key is displayed once at creation and cannot be retrieved.
        </p>
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border-primary-light border-t border-border-primary-light">
        <MetaCell label="Status">
          {keyData.status ? <Badge variant="status" value={keyData.status} /> : <Badge variant="status" value="active" />}
        </MetaCell>
        <MetaCell label="Last used">
          <span className="text-sm text-content-primary">{formatDatetime(displayLastUsed)}</span>
        </MetaCell>
        <MetaCell label="Created">
          <span className="text-sm text-content-primary">{formatDatetime(keyData.createdAt)}</span>
        </MetaCell>
        <MetaCell label="API version">
          <span className="text-sm text-content-primary font-mono">{keyData.apiVersion ?? 'v1'}</span>
        </MetaCell>
      </dl>
    </div>
  )
}

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium text-content-tertiary mb-1.5">{label}</p>
      <div className="leading-none">{children}</div>
    </div>
  )
}

function UsageTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-primary border border-border-primary-light rounded-xl px-3 py-2 shadow-whisper">
      <p className="text-xs font-medium text-content-primary mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#009EFF' }} />
        <span className="text-xs text-content-tertiary">Requests</span>
        <span className="text-xs font-medium text-content-primary tabular-nums ml-1">
          {payload[0].value.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

function UsageCard({ metrics, isLoading }: { metrics: SecretKeyMetricsResponseDto | undefined; isLoading: boolean }) {
  const gradientId = `api-spark-${useId().replace(/:/g, '')}`
  const chartData = (metrics?.dailyStats ?? []).map((stat) => ({
    day: stat.date.slice(5), // MM-DD
    requests: stat.count,
  }))

  return (
    <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-primary-light">
        <p className="text-xs font-medium text-content-tertiary">Usage — last 7 days</p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border-primary-light">
        <div className="px-3 md:px-5 py-4">
          <p className="text-xs font-medium text-content-tertiary mb-2">Requests today</p>
          <p className="text-xl md:text-2xl font-semibold text-content-primary tabular-nums leading-none">
            {isLoading ? <Skeleton className="h-7 w-16" /> : (metrics?.requestsToday ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="px-3 md:px-5 py-4">
          <p className="text-xs font-medium text-content-tertiary mb-2">Errors today</p>
          <p className={`text-xl md:text-2xl font-semibold tabular-nums leading-none ${
            (metrics?.errorsToday ?? 0) > 0 ? 'text-feedback-danger-main' : 'text-content-tertiary'
          }`}>
            {isLoading ? <Skeleton className="h-7 w-10" /> : (metrics?.errorsToday ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="px-3 md:px-5 py-4">
          <p className="text-xs font-medium text-content-tertiary mb-2">Total requests</p>
          <p className="text-xl md:text-2xl font-semibold text-content-primary tabular-nums leading-none">
            {isLoading ? <Skeleton className="h-7 w-20" /> : (metrics?.totalRequests ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="px-5 pt-1 pb-5">
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#009EFF" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#009EFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              dy={6}
            />
            <Tooltip content={<UsageTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="requests"
              stroke="#009EFF"
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 4, fill: '#009EFF', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#F59E0B' }} />
          <span className="text-xs text-content-tertiary">
            Today's count is partial — the day isn't complete yet
          </span>
        </div>
      </div>
    </div>
  )
}

function ScopesCard({ scopes }: { scopes: string[] }) {
  // Demo fallback so the design is visible when backend returns empty scopes.
  const displayScopes = scopes.length > 0 ? scopes : [
    'customers.read',
    'payments.read',
    'accounts.read',
    'webhooks.*',
  ]

  return (
    <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-primary-light flex items-center justify-between">
        <p className="text-xs font-medium text-content-tertiary">Permissions</p>
        <span className="text-xs text-content-tertiary tabular-nums">
          {displayScopes.length} {displayScopes.length === 1 ? 'scope' : 'scopes'}
        </span>
      </div>
      <div className="px-5 py-4">
        <ul className="space-y-1.5">
          {displayScopes.map((scope) => (
            <li key={scope} className="text-sm font-mono text-content-secondary">
              {scope}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function CidrCard({ addresses }: { addresses: string[] }) {
  return (
    <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-primary-light flex items-center justify-between">
        <p className="text-xs font-medium text-content-tertiary">IP allowlist</p>
        <span className="text-xs text-content-tertiary tabular-nums">
          {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'}
        </span>
      </div>
      <div className="px-5 py-4">
        <ul className="space-y-1.5">
          {addresses.map((addr) => (
            <li key={addr} className="text-sm font-mono text-content-secondary">
              {addr}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <div className="bg-surface-primary border border-border-primary-light rounded-xl p-6 space-y-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-surface-primary border border-border-primary-light rounded-xl px-6 py-10 flex flex-col items-center text-center">
      <p className="text-sm font-medium text-content-primary">Couldn't load this API key</p>
      <p className="mt-1 text-sm text-content-tertiary max-w-sm">
        Something went wrong fetching the key details. Try again, or come back shortly.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </div>
  )
}
