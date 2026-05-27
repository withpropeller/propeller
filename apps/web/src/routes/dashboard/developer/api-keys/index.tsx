'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from '@/lib/routing'
import { usePanelContext } from '@/context/PanelContext'
import { KeyRound, Plus, Search } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Label,
  Checkbox,
  Field,
  FieldLabel,
  FieldError,
  TextInput,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  ModalDialog,
  ModalDialogContent,
  ModalDialogHeader,
  ModalDialogTitle,
  ModalDialogDescription,
  ModalDialogBody,
  ModalDialogFooter,
  ModalDialogClose,
  toast,
} from '@/lib/pax'
import { useSecretKeyControllerCreate, useSecretKeyControllerGetAll, getSecretKeyControllerGetAllQueryKey } from '@/api/secret-keys/secret-keys'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { formatDatetime } from '@/lib/format'
import type { ApiHydratedSecretKeyScopesItem } from '@/api/model'

// ── Types ─────────────────────────────────────────────────────────────────────
interface SecretKey {
  id: string
  name: string
  prefix?: string
  key?: string
  apiVersion?: string
  status: string
  permissions?: string[]
  createdAt?: string
  lastUsedAt?: string
  lastIp?: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const API_VERSIONS = [
  { value: '2024-05-01', label: '2024-05-01 (latest)' },
  { value: '2023-02-01', label: '2023-02-01' },
]

const SCOPE_GROUPS: { label: string; scopes: { value: ApiHydratedSecretKeyScopesItem; label: string }[] }[] = [
  {
    label: 'Issuing',
    scopes: [
      { value: 'cards.*', label: 'Cards' },
      { value: 'card-programs.*', label: 'Card programs' },
      { value: 'customers.*', label: 'Customers' },
    ],
  },
  {
    label: 'Payments & Accounts',
    scopes: [
      { value: 'payments.*', label: 'Payments' },
      { value: 'accounts.*', label: 'Accounts' },
    ],
  },
  {
    label: 'Developer',
    scopes: [
      { value: 'webhooks.*', label: 'Webhooks' },
      { value: 'events.read', label: 'Events' },
      { value: 'disputes.*', label: 'Disputes' },
      { value: 'requests.*', label: 'Requests' },
      { value: 'tools.*', label: 'Tools' },
    ],
  },
]

const ALL_SCOPES = SCOPE_GROUPS.flatMap((g) => g.scopes.map((s) => s.value))


// ── Create modal ──────────────────────────────────────────────────────────────

/** Returns true if value is a valid CIDR range. Bare IPs without a prefix are not accepted. */
function isValidCidr(value: string): boolean {
  // IPv4 CIDR — prefix is mandatory: 1.2.3.4/0 to 1.2.3.4/32
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}\/(3[0-2]|[1-2]\d|[0-9])$/
  if (ipv4.test(value)) {
    const parts = value.split('/')[0].split('.')
    return parts.every((p) => parseInt(p, 10) <= 255)
  }

  // IPv6 CIDR — prefix is mandatory, requires at least two colons
  const ipv6 = /^[0-9a-fA-F:]+\/(12[0-8]|1[0-1]\d|[1-9]\d|[0-9])$/
  if (ipv6.test(value) && (value.match(/:/g) || []).length >= 2) {
    return true
  }

  return false
}

interface CreateFormState {
  name: string
  apiVersion: string
  scopes: string[]
  cidrWhitelist: string[]  // array of confirmed tags
}

interface CreateFormErrors {
  name?: string
  scopes?: string
  cidrWhitelist?: string
}

function CreateApiKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<'form' | 'reveal'>('form')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [form, setForm] = useState<CreateFormState>({
    name: '',
    apiVersion: '2024-05-01',
    scopes: [],
    cidrWhitelist: [],
  })
  const [cidrInput, setCidrInput] = useState('')
  const [errors, setErrors] = useState<CreateFormErrors>({})
  const { mutate, isPending } = useSecretKeyControllerCreate()

  function addCidrTag() {
    const val = cidrInput.trim()
    if (!val) return

    // Support multiple values separated by commas (spaces are trimmed per entry, NOT used as delimiters)
    const parts = val.split(',').map(p => p.trim()).filter(Boolean)
    const valid: string[] = []
    const invalid: string[] = []

    parts.forEach(p => {
      if (isValidCidr(p)) valid.push(p)
      else invalid.push(p)
    })

    if (invalid.length > 0) {
      setErrors((p) => ({ ...p, cidrWhitelist: `Invalid entry: ${invalid[0]}${invalid.length > 1 ? ` (+${invalid.length - 1} more)` : ''}` }))
      return
    }

    setForm((p) => ({
      ...p,
      cidrWhitelist: [...new Set([...p.cidrWhitelist, ...valid])]
    }))
    setCidrInput('')
    setErrors((p) => ({ ...p, cidrWhitelist: undefined }))
  }

  function removeCidrTag(tag: string) {
    setForm((p) => ({ ...p, cidrWhitelist: p.cidrWhitelist.filter((t) => t !== tag) }))
  }

  function toggleScope(value: string) {
    setForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(value)
        ? prev.scopes.filter((s) => s !== value)
        : [...prev.scopes, value],
    }))
    if (errors.scopes) setErrors((p) => ({ ...p, scopes: undefined }))
  }

  function toggleGroup(group: (typeof SCOPE_GROUPS)[0]) {
    const groupValues = group.scopes.map((s) => s.value)
    const allSelected = groupValues.every((v) => form.scopes.includes(v))
    setForm((prev) => ({
      ...prev,
      scopes: allSelected
        ? prev.scopes.filter((s) => !groupValues.includes(s as ApiHydratedSecretKeyScopesItem))
        : [...new Set([...prev.scopes, ...groupValues])],
    }))
    if (errors.scopes) setErrors((p) => ({ ...p, scopes: undefined }))
  }

  function validate(): CreateFormErrors {
    const errs: CreateFormErrors = {}
    if (!form.name.trim()) errs.name = 'Enter a name for this API key.'
    if (form.scopes.length === 0) errs.scopes = 'Select at least one permission.'
    return errs
  }

  function handleSubmit() {
    // Commit any pending draft CIDR entry before validating
    const draftVal = cidrInput.trim()
    if (draftVal) {
      if (!isValidCidr(draftVal)) {
        setErrors((p) => ({ ...p, cidrWhitelist: `"${draftVal}" is not a valid IP address or CIDR range.` }))
        return
      }
      setForm((p) => ({ ...p, cidrWhitelist: [...new Set([...p.cidrWhitelist, draftVal])] }))
      setCidrInput('')
    }

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    // Build payload — omit cidrWhitelist entirely when empty
    const cidrWhitelist = [...new Set([...form.cidrWhitelist, ...(draftVal && isValidCidr(draftVal) ? [draftVal] : [])])]

    const payload: any = {
      name: form.name.trim(),
      apiVersion: form.apiVersion,
      scopes: form.scopes as ApiHydratedSecretKeyScopesItem[],
    }
    if (cidrWhitelist.length > 0) payload.cidrWhitelist = cidrWhitelist

    mutate(
      { data: payload },
      {
        onSuccess: (res: any) => {
          const key = res?.data?.plainKey ?? res?.plainKey ?? null
          setCreatedKey(key)
          setStep('reveal')
          onCreated()
        },
        onError: (err: any) => {
          const message = err?.message || 'Failed to create API key.'
          toast({ title: 'Error', description: message, severity: 'danger' } as any)
        },
      },
    )
  }

  function handleDone() {
    onClose()
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open && step !== 'form') onClose(); else if (!open) onClose() }}>
      <ModalDialogContent className="max-w-lg">
        {step === 'form' ? (
          <>
            <ModalDialogHeader>
              <ModalDialogTitle>Create API key</ModalDialogTitle>
              <ModalDialogDescription>
                The full key value is shown once at creation and cannot be retrieved again.
              </ModalDialogDescription>
            </ModalDialogHeader>

            <ModalDialogBody className="space-y-5">
              <Field>
                <FieldLabel>Name <span className="text-feedback-danger-main">*</span></FieldLabel>
                <TextInput
                  placeholder="e.g. Production server"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: (e.target as HTMLInputElement).value }))
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                  }}
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>API version <span className="text-feedback-danger-main">*</span></FieldLabel>
                <Select value={form.apiVersion} onValueChange={(v) => setForm((p) => ({ ...p, apiVersion: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_VERSIONS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Permissions <span className="text-feedback-danger-main">*</span>
                  </Label>
                  <div className="flex gap-5">
                    <Button
                      type="button"
                      variant="text"
                      color="primary"
                      size="sm"
                      onClick={() => {
                        setForm((p) => ({ ...p, scopes: ALL_SCOPES as unknown as string[] }))
                        setErrors((p) => ({ ...p, scopes: undefined }))
                      }}
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      color="secondary"
                      size="sm"
                      onClick={() => setForm((p) => ({ ...p, scopes: [] }))}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {SCOPE_GROUPS.map((group) => {
                    const groupValues = group.scopes.map((s) => s.value)
                    const allSelected = groupValues.every((v) => form.scopes.includes(v))
                    return (
                      <div key={group.label}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                            {group.label}
                          </span>
                          <Button
                            type="button"
                            variant="text"
                            color="primary"
                            size="sm"
                            onClick={() => toggleGroup(group)}
                          >
                            {allSelected ? 'Deselect all' : 'Select all'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {group.scopes.map((scope) => {
                            const checked = form.scopes.includes(scope.value)
                            const checkboxId = `scope-${scope.value}`
                            return (
                              <label
                                key={scope.value}
                                htmlFor={checkboxId}
                                className={[
                                  'flex items-center gap-2 p-2 rounded-lg border text-sm text-content-secondary cursor-pointer transition-colors',
                                  checked
                                    ? 'bg-action-primary-subtle border-action-primary-subtle'
                                    : 'bg-surface-primary border-border-primary-light hover:border-border-primary-main hover:bg-surface-secondary',
                                ].join(' ')}
                              >
                                <Checkbox
                                  id={checkboxId}
                                  checked={checked}
                                  onCheckedChange={() => toggleScope(scope.value)}
                                />
                                {scope.label}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {errors.scopes && (
                  <p className="text-xs text-feedback-danger-main">{errors.scopes}</p>
                )}
                {form.scopes.length > 0 && !errors.scopes && (
                  <p className="text-xs text-content-tertiary">
                    {form.scopes.length} permission{form.scopes.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <Field>
                <FieldLabel>IP allowlist <span className="text-xs font-normal text-content-tertiary">(optional)</span></FieldLabel>

                {/* Tags display */}
                {form.cidrWhitelist.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.cidrWhitelist.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs font-mono bg-surface-secondary border border-border-primary-light rounded-md px-2 py-0.5 text-content-secondary"
                      >
                        {tag}
                        <button
                          type="button"
                          aria-label={`Remove ${tag}`}
                          className="ml-0.5 text-content-tertiary hover:text-feedback-danger-main transition-colors leading-none"
                          onClick={() => removeCidrTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Draft input */}
                <TextInput
                  placeholder="e.g. 192.168.1.1 or 10.0.0.0/24 — press Enter to add"
                  value={cidrInput}
                  onChange={(e) => {
                    setCidrInput((e.target as HTMLInputElement).value)
                    if (errors.cidrWhitelist) setErrors((p) => ({ ...p, cidrWhitelist: undefined }))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addCidrTag()
                    } else if (e.key === 'Backspace' && !cidrInput && form.cidrWhitelist.length > 0) {
                      const last = form.cidrWhitelist[form.cidrWhitelist.length - 1]
                      removeCidrTag(last)
                    }
                  }}
                />
                {errors.cidrWhitelist
                  ? <p className="text-xs text-feedback-danger-main mt-1">{errors.cidrWhitelist}</p>
                  : <p className="text-xs text-content-tertiary mt-1">Enter an IP or CIDR range and press Enter. Leave blank to allow all.</p>
                }
              </Field>
            </ModalDialogBody>

            <ModalDialogFooter>
              <ModalDialogClose asChild>
                <Button variant="outline" color="secondary" onClick={onClose} disabled={isPending}>
                  Cancel
                </Button>
              </ModalDialogClose>
              <Button color="primary" onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Creating…' : 'Create key'}
              </Button>
            </ModalDialogFooter>
          </>
        ) : (
          <>
            <ModalDialogHeader>
              <ModalDialogTitle>API key created</ModalDialogTitle>
              <ModalDialogDescription>
                Copy this key now — it won't be shown again. Store it securely as an environment variable.
              </ModalDialogDescription>
            </ModalDialogHeader>

            <ModalDialogBody>
              <div className="bg-surface-secondary border border-border-primary-light rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                <code className="text-sm font-mono text-content-primary break-all select-all">
                  {createdKey ?? '—'}
                </code>
                {createdKey && (
                  <CopyButton
                    text={createdKey}
                    onCopy={() => toast({ title: 'Copied to clipboard', severity: 'success' } as any)}
                  />
                )}
              </div>
              <p className="text-xs text-feedback-danger-main mt-3 font-medium">
                This is the only time this key will be displayed.
              </p>
            </ModalDialogBody>

            <ModalDialogFooter>
              <Button color="primary" onClick={handleDone}>
                Done
              </Button>
            </ModalDialogFooter>
          </>
        )}
      </ModalDialogContent>
    </ModalDialog>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ApiKeysPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { panelState } = usePanelContext()
  const panelOpen = panelState.type !== null

  const before = searchParams.get('before') ?? ''
  const after = searchParams.get('after') ?? ''

  function handlePageChange(dir: 'before' | 'after', cursorValue: string) {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('before')
    next.delete('after')
    if (cursorValue) next.set(dir, cursorValue)
    router.push(`?${next.toString()}`)
  }

  // ── Columns ─────────────────────────────────────────────────────────────────
  const COLUMNS = [
    {
      header: 'Key name',
      render: (key: SecretKey) => (
        <div>
          <div className="text-sm font-medium text-content-primary">{key.name || <span className="text-content-tertiary font-normal">No name</span>}</div>
          <div className="text-[10px] font-mono text-content-tertiary mt-0.5">
            {key.id}
          </div>
        </div>
      ),
    },
    {
      header: 'API key',
      render: (key: SecretKey) => (
        <code className="text-xs bg-surface-secondary px-2 py-1 rounded border border-border-primary-light font-mono text-content-secondary">
          {key.prefix ?? key.key?.slice(0, 12)}
          <span className="opacity-40">••••</span>
        </code>
      ),
    },
    {
      header: 'Version',
      className: panelOpen ? 'hidden' : '',
      render: (key: SecretKey) => (
        <span className="text-sm text-content-secondary tabular-nums">{key.apiVersion ?? '—'}</span>
      ),
    },
    {
      header: 'Created',
      className: panelOpen ? 'hidden' : 'hidden md:table-cell',
      render: (key: SecretKey) => (
        <span className="text-sm text-content-secondary max-w-[200px] truncate block">
          {key.createdAt ? formatDatetime(key.createdAt) : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (key: SecretKey) => <Badge variant="status" value={key.status} />,
    },
  ]

  // ⌘/ focus shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const queryArgs: any = { limit: 20 }
  if (before) queryArgs.before = before
  if (after) queryArgs.after = after

  const { data, isLoading, error, refetch } = useSecretKeyControllerGetAll(queryArgs)
  const apiKeys: SecretKey[] = (data as any)?.data ?? []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const filteredKeys = apiKeys.filter(
    (k) =>
      k.name?.toLowerCase().includes(search.toLowerCase()) ||
      k.id?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-content-primary leading-snug">API Keys</h1>
        <p className="text-sm text-content-tertiary mt-1">
          Manage your secret keys for authenticating API requests.
        </p>
      </div>

      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <InputGroup className="w-[240px] h-8 shrink-0">
            <InputGroupAddon>
              <Search width={14} height={14} className="text-content-tertiary" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            />
          </InputGroup>

          <Button size="sm" color="primary" onClick={() => setShowCreate(true)}>
            <Plus width={14} height={14} />
            Create API key
          </Button>
        </div>

        {/* Table */}
        <DataTable
          data={filteredKeys}
          columns={COLUMNS}
          isLoading={isLoading}
          error={error ? ((error as any)?.message ?? 'Failed to load API keys') : null}
          onRetry={refetch}
          onRowClick={(row) => router.push(`/dashboard/developer/api-keys/${row.id}`)}
          pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
          emptyState={{
            title: 'No API keys found',
            description: search
              ? 'No keys match your search. Try a different name or ID.'
              : 'API keys will appear here once created.',
            icon: <KeyRound width={20} height={20} />,
          }}
          resourceName="API keys"
          idField="id"
        />
      </div>

      {showCreate && (
        <CreateApiKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: getSecretKeyControllerGetAllQueryKey() })}
        />
      )}
    </div>
  )
}
