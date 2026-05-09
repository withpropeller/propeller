'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { PermissionGate } from '@/components/PermissionGate'
import { Permission } from '@/lib/permissions'
import {
  Button,
  Skeleton,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  ModalDialog,
  ModalDialogContent,
  ModalDialogHeader,
  ModalDialogTitle,
  ModalDialogDescription,
  ModalDialogFooter,
  ModalDialogClose,
  Alert,
  AlertDescription,
  AlertWarningIcon,
} from '@/lib/pax'
import { Badge } from '@/components/ui/Badge'
import { AddEndpointModal } from '@/components/ui/AddEndpointModal'
import { ErrorState } from '@/components/ui/ErrorState'
import { usePanelContext } from '@/context/PanelContext'
import { useWebhookControllerGet, useWebhookControllerDelete } from '@/api/webhooks/webhooks'
import { useQueryClient } from '@tanstack/react-query'

export default function WebhooksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openPanel, panelState } = usePanelContext()
  const panelOpen = panelState.type !== null
  const queryClient = useQueryClient()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  const { data, isLoading, error, refetch } = useWebhookControllerGet()
  const webhooks: any[] = (data?.data as any) || []

  const deleteMutation = useWebhookControllerDelete()

  // Pre-open a specific webhook's detail panel if navigated here with ?webhook=id
  useEffect(() => {
    const id = searchParams?.get('webhook')
    if (id) openPanel('webhook', id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync({ id })
    queryClient.invalidateQueries({ queryKey: ['webhook'] })
    setDeleteTarget(null)
  }

  const totalFailed = webhooks.reduce(
    (sum: number, wh: any) => sum + (wh.deliverySummary?.failed ?? 0),
    0,
  )
  const firstFailingWebhook = webhooks.find((wh: any) => (wh.deliverySummary?.failed ?? 0) > 0)

  const deleteTargetWebhook = webhooks.find((w: any) => w.id === deleteTarget)

  const q = search.trim().toLowerCase()
  const filteredWebhooks = q
    ? webhooks.filter((wh: any) =>
        wh.name?.toLowerCase().includes(q) ||
        wh.url?.toLowerCase().includes(q) ||
        wh.id?.toLowerCase().includes(q)
      )
    : webhooks

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-content-primary leading-snug">Webhooks</h1>
          <p className="text-sm text-content-tertiary mt-1">
            Receive real-time notifications for events in your account.
          </p>
        </div>
        <PermissionGate permission={Permission.WebhooksCreate}>
          <Button
            color="primary"
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer shrink-0"
          >
            + Add endpoint
          </Button>
        </PermissionGate>
      </div>

      {/* Delete confirmation dialog */}
      <ModalDialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <ModalDialogContent showCloseButton={false}>
          <ModalDialogHeader className="gap-1">
            <ModalDialogTitle>Delete webhook endpoint?</ModalDialogTitle>
            <ModalDialogDescription>
              {deleteTargetWebhook && (
                <span className="font-mono text-xs break-all">{deleteTargetWebhook.url}</span>
              )}
              <span className="block mt-1">
                This endpoint will stop receiving events immediately. This cannot be undone.
              </span>
            </ModalDialogDescription>
          </ModalDialogHeader>
          <ModalDialogFooter>
            <ModalDialogClose asChild>
              <Button variant="outline" color="secondary" className="cursor-pointer">
                Cancel
              </Button>
            </ModalDialogClose>
            <Button
              color="danger"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="cursor-pointer"
            >
              Delete endpoint
            </Button>
          </ModalDialogFooter>
        </ModalDialogContent>
      </ModalDialog>

      {/* Failure banner */}
      {totalFailed > 0 && firstFailingWebhook && (
        <Alert severity="warning" variant="filled">
          <AlertWarningIcon />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>
              {totalFailed} {totalFailed === 1 ? 'delivery' : 'deliveries'} failed in the last 24
              hours.
            </span>
            <Button
              variant="ghost"
              color="secondary"
              size="sm"
              onClick={() => openPanel('webhook', firstFailingWebhook.id)}
              className="shrink-0"
            >
              View details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar + table */}
      <div className="space-y-3">
        <div className="flex justify-start">
          <InputGroup className="w-[240px] h-8 shrink-0">
            <InputGroupAddon>
              <Search width={14} height={14} className="text-content-tertiary" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              placeholder="Search by name, URL or ID…"
              value={search}
              onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            />
          </InputGroup>
        </div>

      {/* Endpoints table */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary-light bg-surface-secondary">
              <th className={`px-4 py-2.5 text-left text-xs font-medium text-content-tertiary${panelOpen ? ' hidden' : ''}`}>
                Webhook ID
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary">
                Webhook name
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary">
                URL
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary">
                Status
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary">
                API Version
              </th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary-light">
            {error ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <ErrorState
                    message={(error as any)?.message || 'Failed to load webhooks'}
                    onRetry={refetch}
                  />
                </td>
              </tr>
            ) : isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <tr key={i}>
                  <td className={`px-4 py-3${panelOpen ? ' hidden' : ''}`}>
                    <Skeleton className="h-4 w-28 font-mono" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-36" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-56" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : filteredWebhooks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  {webhooks.length === 0 ? (
                    <>
                      <div className="text-content-tertiary text-sm">No webhook endpoints yet.</div>
                      <Button
                        variant="ghost"
                        color="primary"
                        size="sm"
                        onClick={() => setShowAddModal(true)}
                        className="mt-2"
                      >
                        Add your first endpoint
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-content-tertiary text-sm">No endpoints match &ldquo;{search}&rdquo;.</div>
                      <Button variant="ghost" color="primary" size="sm" onClick={() => setSearch('')} className="mt-1">Clear search</Button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              filteredWebhooks.map((wh: any) => {
                const isSelected = panelState.type === 'webhook' && panelState.id === wh.id

                return (
                  <tr
                    key={wh.id}
                    onClick={() => openPanel('webhook', wh.id)}
                    aria-selected={isSelected || undefined}
                    className="cursor-pointer transition-colors hover:bg-surface-tertiary aria-selected:bg-surface-secondary aria-selected:hover:bg-surface-secondary"
                  >
                    <td className={`px-4 py-3${panelOpen ? ' hidden' : ''}`}>
                      <div className="text-sm font-mono text-content-secondary truncate max-w-36">
                        {wh.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-content-primary truncate max-w-40">
                        {wh.name || (
                          <span className="text-content-tertiary italic">Unnamed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-mono text-content-secondary truncate max-w-60">
                        {wh.url}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="status"
                        value={wh.disabled === true ? 'disabled' : (wh.status ?? 'active')}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-content-secondary">{wh.apiVersion || '—'}</span>
                    </td>
                    <td
                      className="px-4 py-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PermissionGate permission={Permission.WebhooksUpdate}>
                        <Button
                          variant="text"
                          color="secondary"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => setEditTarget(wh)}
                        >
                          Edit
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission={Permission.WebhooksDelete}>
                        <Button
                          variant="text"
                          color="danger"
                          size="sm"
                          onClick={() => setDeleteTarget(wh.id)}
                          className="ml-4 cursor-pointer"
                        >
                          Delete
                        </Button>
                      </PermissionGate>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      </div>{/* end space-y-3 */}

      {(showAddModal || !!editTarget) && (
        <AddEndpointModal
          initialWebhook={editTarget ?? undefined}
          onClose={() => {
            setShowAddModal(false)
            setEditTarget(null)
          }}
          onSuccess={refetch}
        />
      )}
    </div>
  )
}
