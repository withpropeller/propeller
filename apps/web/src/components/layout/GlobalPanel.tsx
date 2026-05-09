'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { usePanelContext } from '@/context/PanelContext'
import { useAccountControllerGet, useAccountControllerGetOne, useAccountControllerGetLogs, useAccountControllerAddDepositChannel, getAccountControllerGetOneQueryKey } from '@/api/accounts/accounts'
import { useCustomerControllerGet } from '@/api/customers/customers'
import { usePaymentControllerGetOne } from '@/api/payments/payments'
import { useCardTransactionControllerGetOne } from '@/api/card-transactions/card-transactions'
import { useDisputeControllerGetOne, useDisputeControllerCreate, useDisputeControllerUpdate, useDisputeControllerClose, getDisputeControllerGetOneQueryKey } from '@/api/disputes/disputes'
import { useWebhookControllerGetOne, useWebhookControllerEnable, useWebhookControllerDisable, useWebhookControllerGetSigningSecret, useWebhookControllerRollSigningSecret } from '@/api/webhooks/webhooks'
import { useEventsControllerGetOne, useEventsControllerRetryEvent } from '@/api/events/events'
import { useApiRequestsControllerGetOne } from '@/api/requests/requests'
import { usePaymentRequestControllerGetOne } from '@/api/payment-requests/payment-requests'
import { AddEndpointModal } from '@/components/ui/AddEndpointModal'
import { X, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownLeft, ArrowRight, Landmark, ChevronRight, ShieldAlert, CreditCard, Webhook, AlertCircle, Download, Eye, EyeOff, Wallet, Network, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { CopyButton } from '@/components/ui/CopyButton'
import { PanelSection, PanelRow } from '@/components/ui/PanelComponents'
import { formatAmount, formatDate, formatDatetime, formatRelativeTime } from '@/lib/format'
import { Button, Chip, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, toast, Toaster } from '@/lib/pax'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'

export function GlobalPanel() {
  const { panelState, closePanel } = usePanelContext()

  const isOpen = !!panelState.id

  return (
    /* Outer: flex item that animates its width to push <main> */
    <div
      className={[
        'flex-shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out',
        isOpen ? 'w-full md:w-95 lg:w-105' : 'w-0',
      ].join(' ')}
    >
      {/* Inner: fixed-width so content never reflows during animation */}
      <div className="h-full w-screen md:w-95 lg:w-105 bg-surface-primary border-l border-border-primary-light flex flex-col overflow-hidden">
        <div className="flex items-center justify-end p-3 shrink-0">
          <button
            onClick={closePanel}
            className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {panelState.type === 'payment' && panelState.id ? (
          <div className="flex-1 min-h-0 flex flex-col px-6">
            <PaymentPanel id={panelState.id} />
          </div>
        ) : panelState.type === 'dispute' && panelState.id ? (
          <div className="flex-1 min-h-0 flex flex-col px-6">
            <DisputePanel id={panelState.id} />
          </div>
        ) : panelState.type === 'webhook' && panelState.id ? (
          <div className="flex-1 min-h-0 flex flex-col px-6">
            <WebhookPanel id={panelState.id} />
          </div>
        ) : panelState.type === 'event' && panelState.id ? (
          <div className="flex-1 min-h-0 flex flex-col px-6">
            <EventPanel id={panelState.id} />
          </div>
        ) : panelState.type === 'log' && panelState.id ? (
          <div className="flex-1 min-h-0 flex flex-col px-6">
            <LogPanel id={panelState.id} />
          </div>
        ) : panelState.type === 'transaction' && panelState.id ? (
          <div className="flex-1 min-h-0 flex flex-col px-6">
            <TransactionPanel id={panelState.id} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {panelState.type === 'account' && panelState.id && <AccountPanel id={panelState.id} />}
            {panelState.type === 'customer' && panelState.id && <CustomerPanel id={panelState.id} />}
            {panelState.type === 'payment-request' && panelState.id && <PaymentRequestPanel id={panelState.id} />}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Account Panel ──────────────────────────────────────────────────────────

function AccountPanel({ id }: { id: string }) {
  const { data, isLoading, error } = useAccountControllerGetOne(id, {
    expand: ['customer balance']
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-24" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-feedback-danger-main">Failed to load account details</p>
        <p className="text-xs text-content-tertiary mt-1">Please try again later</p>
      </div>
    )
  }

  return <AccountDetail account={data.data as any} />
}

function AsOfNote({ timestamp }: { timestamp?: string }) {
  if (!timestamp) return null
  return (
    <div className="text-xs text-content-tertiary mt-1">
      Last updated: {formatDatetime(timestamp)}
    </div>
  )
}

function AccountDetail({ account }: { account: any }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isMerchant = account.owner === 'merchant'
  const isFiat = account.type === 'fiat' || account.type === 'virtual'
  const customerName = typeof account.customer === 'object'
    ? account.customer?.name
    : account.customer

  const { data: historyData, isLoading: historyLoading } = useAccountControllerGetLogs(account.id)
  const history = Array.isArray((historyData?.data as any)) ? (historyData?.data as any) : []

  const addChannelMutation = useAccountControllerAddDepositChannel()

  async function handleAddChannel() {
    try {
      await addChannelMutation.mutateAsync({ id: account.id, data: { type: 'bank-account' } })
      toast({ title: 'Deposit channel added', severity: 'success' })
      queryClient.invalidateQueries({ queryKey: getAccountControllerGetOneQueryKey(account.id) })
    } catch (err: any) {
      toast({ title: 'Failed to add channel', description: err?.message ?? 'Something went wrong.', severity: 'danger' })
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold text-content-primary leading-snug">
          {account.name ?? account.label}
        </h2>
        <div className="text-xs font-mono text-content-tertiary mt-0.5 mb-3">{account.id}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="type" value={account.type} />
          <Badge variant="status" value={account.status} />
        </div>
      </div>

      <div className="border-t border-border-primary-light mb-6" />

      {/* Account details */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Account</p>
        <dl className="space-y-2.5">
          <SectionRow label="Name">{account.name ?? account.label}</SectionRow>
          <SectionRow label="Currency">{account.currency}</SectionRow>
          {!isMerchant && customerName && (
            <SectionRow label="Customer">
              <button
                onClick={() => router.push('/dashboard/customers')}
                className="text-sm font-medium link"
              >
                {customerName}
              </button>
            </SectionRow>
          )}
          <SectionRow label="ID">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm truncate">{account.id}</span>
              <CopyButton text={account.id} />
            </div>
          </SectionRow>
          {account.createdAt && (
            <SectionRow label="Created">{formatDate(account.createdAt)}</SectionRow>
          )}
        </dl>
      </div>

      {/* Balance */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Balance</p>
        <div className="text-2xl font-semibold text-content-primary tabular-nums">
          {formatAmount(account.balance?.available, account.balance?.currency ?? account.currency)}
        </div>
        <AsOfNote timestamp={account.balance?.createdAt} />
      </div>

      {/* Deposit channels — fiat accounts only */}
      {isFiat && (
        <div className="-mx-6 mb-8">
          <div className="flex items-center justify-between mb-3 px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary">Deposit Channels</p>
            <Button
              variant="outline"
              color="secondary"
              size="sm"
              className="cursor-pointer"
              disabled={addChannelMutation.isPending}
              onClick={handleAddChannel}
            >
              {addChannelMutation.isPending ? 'Adding…' : 'Add channel'}
            </Button>
          </div>
          {account.depositChannels?.length > 0 ? (
            account.depositChannels.map((ch: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 px-6 border-b border-border-primary-light last:border-0"
              >
                <div className="shrink-0 w-7 h-7 flex items-center justify-center mt-0.5">
                  <Landmark size={13} className="text-content-tertiary" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="text-sm font-medium text-content-primary truncate">{ch.accountName}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-content-tertiary">{ch.accountNumber}</span>
                    <CopyButton text={ch.accountNumber} />
                  </div>
                  <div className="text-[11px] text-content-tertiary">{ch.bankName} · {ch.bankCode}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-content-tertiary px-6">No deposit channels yet.</p>
          )}
        </div>
      )}

      {/* Balance History */}
      <div className="-mx-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3 px-6">Balance History</p>
        {historyLoading ? (
          <div className="space-y-2 px-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-content-tertiary px-6">No history records found.</p>
        ) : (
          <div>
            {history.map((entry: any, index: number) => {
              const isCredit = entry.mode === 'credit'
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-3 px-6 border-b border-border-primary-light last:border-0"
                >
                  <div className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full ${isCredit ? 'bg-feedback-success-subtle/10' : 'bg-feedback-danger-subtle/10'}`}>
                    {isCredit ? (
                      <ArrowDown size={13} className="text-feedback-success-main" />
                    ) : (
                      <ArrowUp size={13} className="text-feedback-danger-main" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-semibold tabular-nums ${isCredit ? 'text-feedback-success-main' : 'text-feedback-danger-main'}`}>
                        {isCredit ? '+' : '−'}{formatAmount(Math.abs(entry.availableChange), entry.currency)}
                      </span>
                      <span className="text-[11px] text-content-tertiary">
                        {formatRelativeTime(entry.txTime)}
                      </span>
                    </div>
                    <div className="text-[11px] text-content-tertiary">
                      Balance after: <span className="font-medium text-content-secondary tabular-nums">{formatAmount(entry.available, entry.currency)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Transaction Panel ──────────────────────────────────────────────────────

function TransactionPanel({ id }: { id: string }) {
  const { data, isLoading, error } = useCardTransactionControllerGetOne(id, {
    expand: 'card.details customer authorization.dispute authorization.status authorization.events' as any,
  } as any)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-48" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-feedback-danger-main">Failed to load transaction details</p>
      </div>
    )
  }

  return <TransactionDetail txn={data.data as any} />
}

function TransactionDetail({ txn }: { txn: any }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { closePanel } = usePanelContext()

  const isCredit = (txn.amount ?? 0) < 0
  const hasFees = Number(txn.fees) > 0

  const card = txn.card && typeof txn.card === 'object' ? txn.card : null
  const cardId = card?.id ?? (typeof txn.card === 'string' ? txn.card : null)
  const last4 = card?.details?.last4
  const expiry = card?.details?.expiry
  const cardNetwork = card?.network ?? card?.program?.network

  const customer = txn.customer && typeof txn.customer === 'object' ? txn.customer : null
  const customerId = customer?.id ?? (typeof txn.customer === 'string' ? txn.customer : null)

  const acceptor = txn.networkData?.cardAcceptorNameLocation
  const authStatus = txn.authorization?.status
  const canDispute = !txn.authorization?.dispute && authStatus === 'approved'
  const isDeclined = authStatus === 'declined'
  const declineReason = txn.authorization?.decisionReason ?? txn.authorization?.declineReason

  const [disputing, setDisputing] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeText, setDisputeText] = useState('')

  const createDisputeMutation = useDisputeControllerCreate()

  async function handleCreateDispute() {
    if (!disputeReason) {
      toast({ title: 'Select a reason', description: 'Please choose a reason for the dispute.', severity: 'danger' })
      return
    }
    if (!txn.authorization?.id) {
      toast({ title: 'Cannot dispute', description: 'This transaction has no linked authorization.', severity: 'danger' })
      return
    }
    try {
      const payload: any = { source: txn.authorization.id, reason: disputeReason }
      if (disputeText.trim()) payload.text = disputeText.trim()
      await createDisputeMutation.mutateAsync({ data: payload } as any)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string
          return key?.startsWith('/card-transactions') || key?.startsWith('/card-authorizations')
        },
      })
      toast({ title: 'Dispute submitted', severity: 'success' })
      setDisputing(false)
      setDisputeReason('')
      setDisputeText('')
    } catch (err: any) {
      toast({ title: 'Failed to submit dispute', description: err?.message ?? 'Something went wrong.', severity: 'danger' })
    }
  }

  function navigateAndClose(href: string) {
    closePanel()
    router.push(href)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">


      {/* Header */}
      <div className="shrink-0 mb-6">
        <h2 className="text-[22px] font-semibold text-content-primary leading-snug tabular-nums">
          {isCredit ? '+' : ''}
          {formatAmount(Math.abs(txn.amount ?? 0), txn.currency)}
        </h2>
        {hasFees && (
          <div className="text-xs text-content-tertiary mt-0.5">
            Fees: {formatAmount(txn.fees, txn.currency)}
          </div>
        )}
        <div className="text-xs font-mono text-content-tertiary mt-0.5 mb-3 truncate">{txn.id}</div>
        <div className="flex items-center gap-2 flex-wrap">
          {authStatus && <Badge variant="status" value={authStatus} />}
          {txn.authorization?.dispute && <Badge variant="status" value="Disputed" />}
          <span className="text-[10px] text-content-tertiary font-medium">{formatRelativeTime(txn.createdAt)}</span>
        </div>
      </div>

      {/* Declined / abandoned callout */}
      {(isDeclined || txn.status === 'abandoned') && (
        <div className="shrink-0 bg-feedback-danger-subtle/30 border border-feedback-danger-border rounded-lg p-4 flex gap-3 items-start mb-6">
          <AlertCircle width={16} height={16} className="text-feedback-danger-main shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-feedback-danger-main">
              {isDeclined ? 'Authorization declined' : 'Transaction abandoned'}
            </p>
            <p className="text-xs text-feedback-danger-dark leading-relaxed">
              {declineReason || 'This transaction did not complete successfully.'}
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0 gap-0">
        <TabsList className="shrink-0 -mx-6 px-6 border-b border-border-primary-light">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="timeline">History</TabsTrigger>
        </TabsList>

        {/* ── Overview ───────────────────────────── */}
        <TabsContent value="overview" className="flex-1 min-h-0 overflow-y-auto pt-6 pb-6 space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Transaction</p>
            <dl className="space-y-2.5">
              <SectionRow label="Amount">
                <span className="font-semibold tabular-nums">
                  {formatAmount(txn.amount, txn.currency)}
                </span>
              </SectionRow>
              {hasFees && (
                <>
                  <SectionRow label="Fees">
                    <span className="tabular-nums">{formatAmount(txn.fees, txn.currency)}</span>
                  </SectionRow>
                  <SectionRow label="Total">
                    <span className="font-semibold tabular-nums">
                      {formatAmount((txn.amount || 0) + (txn.fees || 0), txn.currency)}
                    </span>
                  </SectionRow>
                </>
              )}
              <SectionRow label="Type">
                {txn.type ? (
                  <span className="capitalize">{String(txn.type).replace(/[-_]/g, ' ')}</span>
                ) : (
                  <span className="text-content-tertiary">—</span>
                )}
              </SectionRow>
              <SectionRow label="Channel">
                {txn.channel ? (
                  <span className="font-mono uppercase">{txn.channel}</span>
                ) : (
                  <span className="text-content-tertiary">—</span>
                )}
              </SectionRow>
              <SectionRow label="Timestamp">
                <span className="tabular-nums">{formatDatetime(txn.createdAt)}</span>
              </SectionRow>
            </dl>
          </div>

          {/* Card */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Card</p>
            <dl className="space-y-2.5">
              <SectionRow label="Card">
                {last4 ? (
                  <button
                    onClick={() => cardId && navigateAndClose(`/dashboard/issuing/cards/${cardId}`)}
                    className="flex items-center gap-2 link"
                    disabled={!cardId}
                  >
                    <NetworkBadge value={cardNetwork} />
                    <span className="font-medium">•••• {last4}</span>
                  </button>
                ) : (
                  <span className="text-content-tertiary">No card linked</span>
                )}
              </SectionRow>
              {expiry && <SectionRow label="Expiry">{expiry}</SectionRow>}
              <SectionRow label="Customer">
                {customer?.name ? (
                  <button
                    onClick={() => customerId && navigateAndClose(`/dashboard/customers/${customerId}`)}
                    className="text-sm font-medium link"
                    disabled={!customerId}
                  >
                    {customer.name}
                  </button>
                ) : (
                  <span className="text-content-tertiary">No customer</span>
                )}
              </SectionRow>
            </dl>
          </div>

          {/* Merchant */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Merchant</p>
            <dl className="space-y-2.5">
              <SectionRow label="Name & location">
                {acceptor || <span className="text-content-tertiary">No merchant recorded</span>}
              </SectionRow>
              <SectionRow label="MCC">
                {txn.networkData?.mcc ? (
                  <span className="font-mono text-xs">{txn.networkData.mcc}</span>
                ) : (
                  <span className="text-content-tertiary">No MCC</span>
                )}
              </SectionRow>
            </dl>
          </div>

          {/* Authorization */}
          {txn.authorization && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Authorization</p>
              <dl className="space-y-2.5">
                <SectionRow label="Status">
                  {authStatus ? (
                    <Badge variant="status" value={authStatus} />
                  ) : (
                    <span className="text-content-tertiary">—</span>
                  )}
                </SectionRow>
                {txn.authorization.type && (
                  <SectionRow label="Type">
                    <Badge variant="type" value={String(txn.authorization.type).replace(/_/g, ' ')} />
                  </SectionRow>
                )}
                {txn.authorization.decisionType && (
                  <SectionRow label="Decision">
                    <span className="capitalize">{txn.authorization.decisionType}</span>
                  </SectionRow>
                )}
                {txn.authorization.dispute?.status && (
                  <SectionRow label="Dispute">
                    <Badge variant="status" value={txn.authorization.dispute.status} />
                  </SectionRow>
                )}
              </dl>
            </div>
          )}
        </TabsContent>

        {/* ── Technical ──────────────────────────── */}
        <TabsContent value="technical" className="flex-1 min-h-0 overflow-y-auto pt-6 pb-6 space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">References</p>
            <dl className="space-y-2.5">
              <SectionRow label="Transaction ID">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs truncate">{txn.id}</span>
                  <CopyButton text={txn.id} />
                </div>
              </SectionRow>
              {txn.authorization?.id && (
                <SectionRow label="Authorization ID">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs truncate">{txn.authorization.id}</span>
                    <CopyButton text={txn.authorization.id} />
                  </div>
                </SectionRow>
              )}
              <SectionRow label="Network ref">
                {txn.networkData?.reference ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs truncate">{txn.networkData.reference}</span>
                    <CopyButton text={txn.networkData.reference} />
                  </div>
                ) : (
                  <span className="text-content-tertiary">—</span>
                )}
              </SectionRow>
            </dl>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Network data</p>
            <dl className="space-y-2.5">
              <SectionRow label="RRN">
                {txn.networkData?.rrn ? (
                  <span className="font-mono text-xs">{txn.networkData.rrn}</span>
                ) : (
                  <span className="text-content-tertiary">—</span>
                )}
              </SectionRow>
              <SectionRow label="STAN">
                {txn.networkData?.stan ? (
                  <span className="font-mono text-xs">{txn.networkData.stan}</span>
                ) : (
                  <span className="text-content-tertiary">—</span>
                )}
              </SectionRow>
              <SectionRow label="Terminal ID">
                {txn.networkData?.terminalId ? (
                  <span className="font-mono text-xs">{txn.networkData.terminalId}</span>
                ) : (
                  <span className="text-content-tertiary">—</span>
                )}
              </SectionRow>
              <SectionRow label="Network">
                {txn.networkData?.network ? (
                  <span className="capitalize">{txn.networkData.network}</span>
                ) : (
                  <span className="text-content-tertiary">—</span>
                )}
              </SectionRow>
              {txn.networkData?.partner && (
                <SectionRow label="Partner">
                  <span className="capitalize">{txn.networkData.partner}</span>
                </SectionRow>
              )}
            </dl>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Timing</p>
            <dl className="space-y-2.5">
              <SectionRow label="Processing date">
                <span className="tabular-nums">{formatDatetime(txn.createdAt)}</span>
              </SectionRow>
              <SectionRow label="Settlement date">
                <span className="text-content-tertiary">No settlement date</span>
              </SectionRow>
              {txn.updatedAt && (
                <SectionRow label="Updated">
                  <span className="tabular-nums">{formatDatetime(txn.updatedAt)}</span>
                </SectionRow>
              )}
            </dl>
          </div>
        </TabsContent>

        {/* ── History ────────────────────────────── */}
        <TabsContent value="timeline" className="flex-1 min-h-0 overflow-y-auto pt-6 pb-6">
          {(txn.authorization?.events?.length ?? 0) > 0 ? (
            <div className="-mx-6">
              {txn.authorization.events.map((ev: any, i: number) => {
                const evType = String(ev.type || '')
                const isFailure = evType.includes('decline') || evType.includes('fail') || evType.includes('reverse')
                return (
                  <div
                    key={ev.id ?? i}
                    className="flex gap-4 px-6 py-4"
                  >
                    <div className="mt-1 flex flex-col items-center">
                      <div className={[
                        'w-2 h-2 rounded-full shrink-0',
                        isFailure ? 'bg-feedback-danger-main' : 'bg-feedback-success-main',
                      ].join(' ')} />
                      {i < txn.authorization.events.length - 1 && (
                        <div className="w-px flex-1 bg-border-primary-light mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="text-sm font-medium text-content-primary capitalize">
                        {evType.replace(/[-_]/g, ' ') || 'Event'}
                      </div>
                      {typeof ev.attempts?.length === 'number' && ev.attempts.length > 0 && (
                        <div className="text-xs text-content-tertiary mt-0.5">
                          {ev.attempts.length} attempt{ev.attempts.length === 1 ? '' : 's'}
                        </div>
                      )}
                      <div className="text-[10px] text-content-tertiary mt-1 tabular-nums">
                        {formatDatetime(ev.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-content-tertiary italic">
              No historical events for this transaction.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action footer */}
      <div className="shrink-0 -mx-6 px-6 pt-4 pb-6 bg-surface-primary border-t border-border-primary-light">
        {disputing && (
          <div className="rounded-xl border border-feedback-danger-border bg-feedback-danger-subtle/10 p-4 space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-content-primary">Create a dispute</p>
              <button
                onClick={() => setDisputing(false)}
                className="text-content-tertiary hover:text-content-primary transition-colors cursor-pointer"
              >
                <X width={14} height={14} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-content-secondary">
                Reason for dispute <span className="text-feedback-danger-main">*</span>
              </label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reason…" />
                </SelectTrigger>
                <SelectContent>
                  {DISPUTE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-content-secondary">
                More details <span className="text-content-tertiary">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                placeholder="Provide additional context about the dispute…"
                className="w-full rounded-lg border border-border-primary-light bg-surface-primary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-main resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                color="danger"
                className="flex-1 cursor-pointer"
                disabled={createDisputeMutation.isPending}
                onClick={handleCreateDispute}
              >
                {createDisputeMutation.isPending ? 'Submitting…' : 'Submit dispute'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                color="secondary"
                className="cursor-pointer"
                onClick={() => setDisputing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {txn.authorization?.id && (
            <Button
              variant="outline"
              color="secondary"
              size="sm"
              className="gap-1.5 flex-1 cursor-pointer"
              onClick={() => navigateAndClose(`/dashboard/issuing/authorizations/${txn.authorization.id}`)}
            >
              View authorization
              <ArrowRight width={13} height={13} />
            </Button>
          )}
          {canDispute && (
            <Button
              variant="outline"
              color="danger"
              size="sm"
              className="gap-1.5 flex-1 cursor-pointer"
              onClick={() => setDisputing((v) => !v)}
            >
              <ShieldAlert width={13} height={13} />
              Dispute
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Customer Panel ─────────────────────────────────────────────────────────

function CustomerPanel({ id }: { id: string }) {
  const { data, isLoading, error } = useCustomerControllerGet(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-4 w-24" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-feedback-danger-main">Failed to load customer details</p>
        <p className="text-xs text-content-tertiary mt-1">Please try again later</p>
      </div>
    )
  }

  return <CustomerDetail customer={data.data as any} />
}

// ─── Payment Panel ─────────────────────────────────────────────────────────

function PaymentPanel({ id }: { id: string }) {
  const { data, isLoading, error } = usePaymentControllerGetOne(id, {
    expand: 'account dispute events' as any,
  } as any)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-48" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-feedback-danger-main">Failed to load payment details</p>
      </div>
    )
  }

  return <PaymentDetail payment={data.data as any} />
}

const DISPUTE_REASONS = [
  { label: 'General', value: 'general' },
  { label: 'Fraudulent Transaction', value: 'fraudulent' },
  { label: 'Duplicate Transaction', value: 'duplicate' },
  { label: 'Value Not Received', value: 'value-not-received' },
]

function PaymentDetail({ payment }: { payment: any }) {
  const isInflow = payment.type !== 'payout'
  const bt = payment.methodData?.bankTransfer

  const [disputing, setDisputing] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeText, setDisputeText] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const createDisputeMutation = useDisputeControllerCreate()





  async function handleDownloadReceipt() {
    setDownloadingPdf(true)
    try {
      const isBrowser = typeof window !== 'undefined'
      const token = isBrowser ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null
      const mode = isBrowser ? (localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) ?? 'live') : 'live'
      const res = await fetch(`${API_BASE_URL}/payments/${payment.id}/generate/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-dashboard-mode': mode,
        },
      })
      if (!res.ok) throw new Error('Could not generate receipt')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${payment.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      toast({ title: 'Download failed', description: err?.message ?? 'Could not generate receipt.', severity: 'danger' })
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleCreateDispute() {
    if (!disputeReason) {
      toast({ title: 'Select a reason', description: 'Please choose a reason for the dispute.', severity: 'danger' })
      return
    }
    try {
      const payload: any = { source: payment.id, reason: disputeReason }
      if (disputeText.trim()) payload.text = disputeText.trim()
      await createDisputeMutation.mutateAsync({ data: payload } as any)
      toast({ title: 'Dispute created', description: 'Your dispute has been submitted successfully.', severity: 'success' })
      setDisputing(false)
      setDisputeReason('')
      setDisputeText('')
    } catch (err: any) {
      toast({ title: 'Failed to create dispute', description: err?.message ?? 'Something went wrong.', severity: 'danger' })
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Header */}
      <div className="shrink-0 mb-6">
        <h2 className="text-[22px] font-semibold text-content-primary leading-snug tabular-nums">
          {formatAmount(payment.amount, payment.currency)}
        </h2>
        {payment.fees > 0 && (
          <div className="text-xs text-content-tertiary mt-0.5">
            Fees: {formatAmount(payment.fees, payment.currency)}
          </div>
        )}
        <div className="text-xs font-mono text-content-tertiary mt-0.5 mb-3">{payment.id}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="status" value={payment.status} />
          <span className="text-[10px] text-content-tertiary font-medium">{formatRelativeTime(payment.createdAt)}</span>
        </div>
      </div>

      {/* Failure callout */}
      {payment.status === 'failed' && (
        <div className="shrink-0 bg-feedback-danger-subtle/30 border border-feedback-danger-border rounded-lg p-4 flex gap-3 items-start mb-6">
          <AlertCircle width={16} height={16} className="text-feedback-danger-main shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-feedback-danger-main">Payment failed</p>
            <p className="text-xs text-feedback-danger-dark leading-relaxed">
              {payment.failureReason || 'Processor rejected the transaction. This could be due to insufficient funds or network error.'}
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0 gap-0">
        <TabsList className="shrink-0 -mx-6 px-6 border-b border-border-primary-light">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* ── Overview ───────────────────────────── */}
        <TabsContent value="overview" className="flex-1 min-h-0 overflow-y-auto pt-6 pb-6 space-y-8">
          {payment.account && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Account</p>
              <dl className="space-y-2.5">
                {payment.account.name && (
                  <SectionRow label="Account name">{payment.account.name}</SectionRow>
                )}
                {payment.account.type && (
                  <SectionRow label="Account type">
                    <span className="capitalize">{payment.account.type} account</span>
                  </SectionRow>
                )}
                <SectionRow label="Currency">
                  <span className="uppercase font-mono">{payment.currency}</span>
                </SectionRow>
              </dl>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Transaction</p>
            <dl className="space-y-2.5">
              <SectionRow label="Net amount">
                <span className="font-semibold tabular-nums">
                  {formatAmount((payment.amount ?? 0) - (payment.fees ?? 0), payment.currency)}
                </span>
              </SectionRow>
              <SectionRow label="Processing fee">
                <span className="tabular-nums">
                  {(payment.fees ?? 0) > 0 ? formatAmount(payment.fees, payment.currency) : '—'}
                </span>
              </SectionRow>
              {payment.feeBreakdown?.[0]?.type && (
                <SectionRow label="Fee type">
                  <span className="capitalize">
                    {payment.feeBreakdown[0].type.replace(/[-_]/g, ' ')}
                  </span>
                </SectionRow>
              )}
              <SectionRow label="Type">
                <div className="flex items-center gap-2">
                  {isInflow ? (
                    <ArrowDownLeft width={12} height={12} className="text-feedback-success-main" />
                  ) : (
                    <ArrowUpRight width={12} height={12} className="text-feedback-danger-main" />
                  )}
                  <span className="capitalize">{payment.type?.replace(/_/g, ' ')}</span>
                </div>
              </SectionRow>
              <SectionRow label="Timestamp">
                <span className="tabular-nums">{formatDatetime(payment.createdAt)}</span>
              </SectionRow>
            </dl>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Payment method</p>
            <dl className="space-y-2.5">
              <SectionRow label="Method">
                <span className="capitalize">{payment.method?.replace(/_/g, ' ') || '—'}</span>
              </SectionRow>
              {bt && (
                <>
                  {bt.bankName && <SectionRow label="Bank name">{bt.bankName}</SectionRow>}
                  {bt.bankCode && <SectionRow label="Bank code">{bt.bankCode}</SectionRow>}
                  {bt.accountNumber && (
                    <SectionRow label="Account number">
                      <span className="font-mono">{bt.accountNumber}</span>
                    </SectionRow>
                  )}
                  {bt.accountName && <SectionRow label="Account name">{bt.accountName}</SectionRow>}
                  {bt.sourceAccountName && <SectionRow label="Source">{bt.sourceAccountName}</SectionRow>}
                  {bt.narration && (
                    <SectionRow label="Narration">{bt.narration}</SectionRow>
                  )}
                </>
              )}
            </dl>
            {payment.method === 'card' && (
              <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg border border-border-primary-light mt-3">
                <CreditCard width={16} height={16} className="text-content-tertiary" />
                <span className="text-sm font-medium text-content-primary">Card payment via Checkout</span>
              </div>
            )}
          </div>

          {(payment.feeBreakdown?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Fee breakdown</p>
              <dl className="space-y-2.5">
                {payment.feeBreakdown.map((fee: any, idx: number) => (
                  <SectionRow key={idx} label={fee.group || 'Service fee'}>
                    {formatAmount(fee.amount, payment.currency)}
                  </SectionRow>
                ))}
              </dl>
            </div>
          )}

          {payment.dispute && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Dispute</p>
              <dl className="space-y-2.5">
                <SectionRow label="Status">
                  <Badge variant="status" value={payment.dispute.status} />
                </SectionRow>
                {payment.dispute.reason && (
                  <SectionRow label="Reason">
                    <span className="capitalize">
                      {payment.dispute.reason.replace(/[-_]/g, ' ')}
                    </span>
                  </SectionRow>
                )}
              </dl>
            </div>
          )}
        </TabsContent>

        {/* ── Technical ──────────────────────────── */}
        <TabsContent value="technical" className="flex-1 min-h-0 overflow-y-auto pt-6 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">References</p>
            <dl className="space-y-2.5">
              <SectionRow label="Payment ID">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs truncate">{payment.id}</span>
                  <CopyButton text={payment.id} />
                </div>
              </SectionRow>
              <SectionRow label="Account ID">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs truncate">
                    {payment.account?.id || (typeof payment.account === 'string' ? payment.account : '—')}
                  </span>
                  {(payment.account?.id || typeof payment.account === 'string') && (
                    <CopyButton text={payment.account?.id || payment.account} />
                  )}
                </div>
              </SectionRow>
              <SectionRow label="Session ID">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">
                    {payment.processorData?.sessionId || '—'}
                  </span>
                  {payment.processorData?.sessionId && (
                    <CopyButton text={payment.processorData.sessionId} />
                  )}
                </div>
              </SectionRow>
            </dl>
          </div>
        </TabsContent>

        {/* ── History ────────────────────────────── */}
        <TabsContent value="timeline" className="flex-1 min-h-0 overflow-y-auto pt-6 pb-6">
          {(payment.events?.length ?? 0) > 0 ? (
            <div className="-mx-6">
              {payment.events.map((ev: any, i: number) => (
                <div
                  key={ev.id ?? i}
                  className="flex gap-4 px-6 py-4"
                >
                  <div className="mt-1 flex flex-col items-center">
                    <div className={[
                      'w-2 h-2 rounded-full shrink-0',
                      ev.type?.includes('fail') ? 'bg-feedback-danger-main' : 'bg-feedback-success-main',
                    ].join(' ')} />
                    {i < payment.events.length - 1 && (
                      <div className="w-px flex-1 bg-border-primary-light mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="text-sm font-medium text-content-primary capitalize">
                      {ev.name?.replace(/_/g, ' ') || ev.type || 'Event'}
                    </div>
                    {ev.description && (
                      <div className="text-xs text-content-tertiary mt-0.5">{ev.description}</div>
                    )}
                    <div className="text-[10px] text-content-tertiary mt-1 tabular-nums">
                      {formatDatetime(ev.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-content-tertiary italic">
              No historical events for this payment.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action footer */}
      <div className="shrink-0 -mx-6 px-6 pt-4 pb-6 bg-surface-primary border-t border-border-primary-light">
        {disputing && (
          <div className="rounded-xl border border-feedback-danger-border bg-feedback-danger-subtle/10 p-4 space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-content-primary">Create a dispute</p>
              <button
                onClick={() => setDisputing(false)}
                className="text-content-tertiary hover:text-content-primary transition-colors cursor-pointer"
              >
                <X width={14} height={14} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-content-secondary">
                Reason for dispute <span className="text-feedback-danger-main">*</span>
              </label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reason…" />
                </SelectTrigger>
                <SelectContent>
                  {DISPUTE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-content-secondary">
                More details <span className="text-content-tertiary">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                placeholder="Provide additional context about the dispute…"
                className="w-full rounded-lg border border-border-primary-light bg-surface-primary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-main resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                color="danger"
                className="flex-1 cursor-pointer"
                disabled={createDisputeMutation.isPending}
                onClick={handleCreateDispute}
              >
                {createDisputeMutation.isPending ? 'Submitting…' : 'Submit dispute'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                color="secondary"
                className="cursor-pointer"
                onClick={() => setDisputing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Download receipt — hidden for now
          <Button
            variant="outline"
            color="secondary"
            size="sm"
            className="gap-1.5 flex-1 cursor-pointer"
            disabled={downloadingPdf}
            onClick={handleDownloadReceipt}
          >
            <Download width={13} height={13} />
            {downloadingPdf ? 'Generating…' : 'Download receipt'}
          </Button>
          */}
          <Button
            variant="outline"
            color="danger"
            size="sm"
            className="gap-1.5 flex-1 cursor-pointer"
            onClick={() => setDisputing((v) => !v)}
          >
            <ShieldAlert width={13} height={13} />
            Dispute payment
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Dispute Panel ───────────────────────────────────────────────────────────

function resolveDisputeActor(item: any): { name: string; initials: string; isSystem: boolean } {
  if (item.actorType === 'system' || item.actorType === 'allawee') {
    return { name: 'Allawee Inc.', initials: 'AI', isSystem: true }
  }
  if (item.customer && typeof item.customer === 'object') {
    const first = item.customer.firstName ?? ''
    const last = item.customer.lastName ?? ''
    const name = `${first} ${last}`.trim() || 'Customer'
    const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'CU'
    return { name, initials, isSystem: false }
  }
  if (item.actorType === 'customer') {
    return { name: 'Customer', initials: 'CU', isSystem: false }
  }
  if (item.user && typeof item.user === 'object') {
    const fullName = item.user.fullName || `${item.user.firstName ?? ''} ${item.user.lastName ?? ''}`.trim() || 'Team Member'
    const parts = fullName.split(' ')
    const initials = parts.length >= 2
      ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
      : fullName.substring(0, 2).toUpperCase()
    return { name: fullName, initials, isSystem: false }
  }
  return { name: 'Team Member', initials: 'TM', isSystem: false }
}

function DisputePanel({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { openPanel, closePanel } = usePanelContext()
  const { data, isLoading, error } = useDisputeControllerGetOne(id, {
    expand: 'source source.card events' as any,
  } as any)

  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [closing, setClosing] = useState(false)

  const updateMutation = useDisputeControllerUpdate()
  const closeMutation = useDisputeControllerClose()

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getDisputeControllerGetOneQueryKey(id) })
  }

  async function handleReply() {
    if (!replyText.trim()) return
    setReplying(true)
    try {
      await updateMutation.mutateAsync({ id, data: { text: replyText.trim() } })
      toast({ title: 'Response posted', severity: 'success' })
      setReplyText('')
      invalidate()
    } catch (err: any) {
      toast({ title: 'Failed to post response', description: err?.message ?? 'Something went wrong.', severity: 'danger' })
    } finally {
      setReplying(false)
    }
  }

  async function handleClose() {
    if (!window.confirm('This dispute will be marked as closed. Continue?')) return
    setClosing(true)
    try {
      await closeMutation.mutateAsync({ id, data: {} })
      toast({ title: 'Dispute closed', severity: 'success' })
      invalidate()
    } catch (err: any) {
      toast({ title: 'Failed to close dispute', description: err?.message ?? 'Something went wrong.', severity: 'danger' })
    } finally {
      setClosing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 pt-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-48" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-feedback-danger-main">Failed to load dispute</p>
      </div>
    )
  }

  const dispute = data.data as any
  const disputeSource = dispute.source as any
  const sourceCard = disputeSource?.card
  const isCardTxnSource = !!(disputeSource?.authorization)
  const isPaymentSource = !!(disputeSource?.method)
  const isClosed = dispute.status === 'closed' || dispute.status === 'resolved'
  const timeline: any[] = [...(dispute.timeline || dispute.events || [])].reverse()

  function unSlugify(str: string | undefined) {
    if (!str) return '—'
    return str.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">


      {/* ── Scrollable content ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-4">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="mb-5">
          <h2 className="text-[22px] font-semibold text-content-primary leading-snug tabular-nums">
            {formatAmount(dispute.amount, dispute.currency)}
          </h2>
          <div className="text-xs font-mono text-content-tertiary mt-0.5 mb-3">{dispute.id}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="status" value={dispute.status} />
          </div>
        </div>

        <div className="border-t border-border-primary-light mb-5" />

        {/* ── Dispute Details ─────────────────────────────── */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Dispute Details</p>
          <dl className="space-y-2.5">
            <SectionRow label="Reason">
              <span className="capitalize">{unSlugify(dispute.reason)}</span>
            </SectionRow>
            <SectionRow label="Date Created">
              <span className="tabular-nums">{formatDatetime(dispute.createdAt)}</span>
            </SectionRow>
            <SectionRow label="Source">
              {disputeSource?.id ? (
                <div className="flex items-center gap-2">
                  {isPaymentSource
                    ? <Landmark width={12} height={12} className="text-content-tertiary" />
                    : <CreditCard width={12} height={12} className="text-content-tertiary" />
                  }
                  <button
                    onClick={() => {
                      if (isPaymentSource) { closePanel(); router.push(`/dashboard/payments?id=${disputeSource.id}`) }
                      else if (isCardTxnSource) { closePanel(); router.push(`/dashboard/issuing/transactions?id=${disputeSource.id}`) }
                      else { closePanel(); router.push(`/dashboard/issuing/authorizations/${disputeSource.id}`) }
                    }}
                    className="text-xs font-mono text-content-tertiary hover:text-action-primary-main hover:underline truncate max-w-40 text-left cursor-pointer"
                  >
                    {disputeSource.id}
                  </button>
                  <CopyButton text={disputeSource.id} />
                </div>
              ) : (
                <span className="text-xs font-mono text-content-tertiary">—</span>
              )}
            </SectionRow>
            {sourceCard && (
              <SectionRow label="Source Card">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 rounded border border-border-primary-light bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white uppercase">
                    {sourceCard.network?.charAt(0) || 'C'}
                  </div>
                  {sourceCard.id ? (
                    <button
                      onClick={() => { closePanel(); router.push(`/dashboard/issuing/cards/${sourceCard.id}`) }}
                      className="text-xs font-mono text-content-tertiary hover:text-action-primary-main hover:underline truncate max-w-40 text-left cursor-pointer"
                    >
                      •••• {sourceCard.details?.last4 || '••••'}
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-content-tertiary">•••• {sourceCard.details?.last4 || '••••'}</span>
                  )}
                  {sourceCard.id && <CopyButton text={sourceCard.id} />}
                </div>
              </SectionRow>
            )}
            <SectionRow label="ID">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs truncate max-w-28">{dispute.id}</span>
                <CopyButton text={dispute.id} />
              </div>
            </SectionRow>
          </dl>
        </div>

        {/* ── Close dispute ───────────────────────────────── */}
        {!isClosed && (
          <Button
            size="sm"
            variant="outline"
            color="danger"
            className="w-full mb-8 cursor-pointer"
            onClick={handleClose}
            disabled={closing}
          >
            {closing ? 'Closing…' : 'Close dispute'}
          </Button>
        )}

        {/* ── Last Activity (full timeline) ───────────────── */}
        {timeline.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-4">Last Activity</p>
            <div className="space-y-0">
              {timeline.map((item, i) => {
                const isLast = i === timeline.length - 1
                const { name, initials, isSystem } = resolveDisputeActor(item)
                const action = item.action === 'created' ? 'opened' : (item.action || 'updated')
                return (
                  <div key={i} className="flex gap-3">
                    {/* Avatar + connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${isSystem
                          ? 'bg-slate-900 text-white'
                          : 'bg-surface-secondary border border-border-primary-light text-content-secondary'
                        }`}>
                        {initials}
                      </div>
                      {!isLast && <div className="w-px flex-1 min-h-4 bg-border-primary-light my-1.5" />}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 min-w-0 ${isLast ? 'pb-2' : 'pb-5'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm leading-snug">
                          <span className="font-semibold text-content-primary">{name}</span>
                          {' '}
                          <span className="text-content-tertiary">{action} the dispute</span>
                        </div>
                        {isSystem && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-900 text-white shrink-0">
                            System
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-content-tertiary mt-0.5 tabular-nums">
                        {formatDatetime(item.createdAt)}
                      </div>
                      {item.text && (
                        <div className="mt-2 px-3 py-2 border border-border-primary-light rounded-b-lg rounded-tr-lg bg-surface-secondary text-xs text-content-secondary leading-relaxed">
                          {item.text}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Anchored reply composer ──────────────────────── */}
      {!isClosed && (
        <div className="shrink-0 border-t border-border-primary-light pt-3 pb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }}
              placeholder="Add a comment…"
              className="flex-1 min-w-0 rounded-lg border border-border-primary-light bg-surface-secondary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-main"
            />
            <Button
              size="sm"
              onClick={handleReply}
              disabled={replying || !replyText.trim()}
            >
              {replying ? '…' : 'Send'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Webhook Panel ───────────────────────────────────────────────────────────

function WebhookPanel({ id }: { id: string }) {
  const { data, isLoading, error, refetch } = useWebhookControllerGetOne(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-feedback-danger-main">Failed to load endpoint</p>
      </div>
    )
  }

  return <WebhookDetail webhook={data.data as any} onRefetch={refetch} />
}

function WebhookDetail({ webhook, onRefetch }: { webhook: any; onRefetch: () => void }) {
  const [showEdit, setShowEdit] = useState(false)
  const [showSigningKey, setShowSigningKey] = useState(false)
  const enableMutation = useWebhookControllerEnable()
  const disableMutation = useWebhookControllerDisable()
  const rollMutation = useWebhookControllerRollSigningSecret()

  const { data: secretData, refetch: refetchSecret } = useWebhookControllerGetSigningSecret(webhook.id, {
    query: { enabled: showSigningKey },
  })
  const signingKey = (secretData as any)?.data?.signingKey

  function handleRollSecret() {
    rollMutation.mutate(
      {
        id: webhook.id,
        data: { signingKey: signingKey },
      },
      {
        onSuccess: () => {
          refetchSecret()
          toast({ title: 'Signing secret rolled', severity: 'success' })
        },
        onError: (err: any) => {
          toast({ title: 'Failed to roll secret', description: err?.message, severity: 'danger' })
        },
      },
    )
  }

  const isDisabled = webhook.disabled === true
  const toggling = enableMutation.isPending || disableMutation.isPending

  function handleToggle() {
    if (isDisabled) {
      enableMutation.mutate({ id: webhook.id }, { onSuccess: onRefetch })
    } else {
      disableMutation.mutate({ id: webhook.id }, { onSuccess: onRefetch })
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {showEdit && typeof document !== 'undefined' && createPortal(
        <AddEndpointModal
          initialWebhook={webhook}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); onRefetch() }}
        />,
        document.body
      )}

      {/* Header */}
      <div className="shrink-0 mb-6">
        <h2 className="text-[22px] font-semibold text-content-primary leading-snug">
          {webhook.name || <span className="text-content-tertiary italic text-base font-normal">Unnamed endpoint</span>}
        </h2>
        {webhook.description && (
          <div className="text-xs text-content-tertiary mt-0.5">{webhook.description}</div>
        )}
        <div className="text-xs font-mono text-content-tertiary mt-0.5 mb-3 break-all leading-snug">
          {webhook.url}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="status" value={isDisabled ? 'disabled' : (webhook.status ?? 'active')} />
          <span className="text-[10px] text-content-tertiary font-medium">{formatRelativeTime(webhook.createdAt)}</span>
        </div>
        <div className="mt-4">
          <Button variant="outline" color="secondary" size="sm" className="w-full cursor-pointer" onClick={() => setShowEdit(true)}>
            Edit endpoint
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0 gap-0">
        <TabsList className="shrink-0 -mx-6 px-6 border-b border-border-primary-light">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* ── Overview ───────────────────────────── */}
        <TabsContent value="overview" className="flex-1 min-h-0 overflow-y-auto pt-6 pb-6 space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Endpoint</p>
            <dl className="space-y-2.5">
              <SectionRow label="URL">
                <span className="font-mono text-xs break-all">{webhook.url}</span>
              </SectionRow>
              <SectionRow label="Status">
                <Badge variant="status" value={isDisabled ? 'disabled' : (webhook.status ?? 'active')} />
              </SectionRow>
              {webhook.apiVersion && (
                <SectionRow label="API version">{webhook.apiVersion}</SectionRow>
              )}
              <SectionRow label="Created">
                <span className="tabular-nums">{formatDatetime(webhook.createdAt)}</span>
              </SectionRow>
            </dl>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Subscribed events</p>
            <div className="flex flex-wrap gap-1.5">
              {(webhook.events ?? []).map((ev: string) => (
                <span
                  key={ev}
                  className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium font-mono bg-surface-secondary border border-border-primary-light text-content-secondary"
                >
                  {ev}
                </span>
              ))}
              {(!webhook.events || webhook.events.length === 0) && (
                <span className="text-sm text-content-tertiary">No events subscribed.</span>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Security ───────────────────────────── */}
        <TabsContent value="security" className="flex-1 min-h-0 overflow-y-auto pt-6 pb-6 space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Signing secret</p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                {showSigningKey && signingKey ? (
                  <span className="font-mono text-xs break-all text-content-primary">{signingKey}</span>
                ) : (
                  <span className="text-content-tertiary tracking-widest text-sm select-none">
                    ••••••••••••••••••••••••••
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowSigningKey((v) => !v)}
                  className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-surface-secondary rounded-md transition-colors"
                  title={showSigningKey ? 'Hide' : 'Reveal'}
                >
                  {showSigningKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {showSigningKey && signingKey && (
                  <CopyButton text={signingKey} />
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">References</p>
            <dl className="space-y-2.5">
              <SectionRow label="Webhook ID">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs truncate">{webhook.id}</span>
                  <CopyButton text={webhook.id} />
                </div>
              </SectionRow>
            </dl>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action footer */}
      <div className="shrink-0 -mx-6 px-6 pt-4 pb-6 bg-surface-primary border-t border-border-primary-light">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            color={isDisabled ? 'secondary' : 'danger'}
            size="sm"
            className="gap-1.5 flex-1 cursor-pointer"
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling ? 'Saving…' : isDisabled ? 'Enable' : 'Disable'}
          </Button>
          <Button
            variant="outline"
            color="secondary"
            size="sm"
            className="gap-1.5 flex-1 cursor-pointer"
            onClick={handleRollSecret}
            disabled={rollMutation.isPending}
          >
            {rollMutation.isPending ? 'Rolling…' : 'Roll secret'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Log Panel ──────────────────────────────────────────────────────────────


const LOG_CHIP_OVERRIDES: Record<string, string> = {
  success: '!bg-feedback-success-light !border-feedback-success-border !text-feedback-success-dark',
  error: '!bg-feedback-danger-light !border-feedback-danger-border !text-feedback-danger-main',
  information: '!bg-feedback-information-light !border-feedback-information-border !text-feedback-information-dark',
}

function logStatusColor(status: string) {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'error'
  return 'secondary'
}

function LogMethodChip({ method }: { method: string }) {
  const isPost = method?.toUpperCase() === 'POST'
  const color = isPost ? 'information' : 'secondary'
  return (
    <Chip variant="status" color={color as any} className={LOG_CHIP_OVERRIDES[color] ?? ''}>
      {method?.toUpperCase()}
    </Chip>
  )
}

function LogStatusChip({ status }: { status: string }) {
  const color = logStatusColor(status)
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : status
  return (
    <Chip variant="status" color={color as any} className={LOG_CHIP_OVERRIDES[color] ?? ''}>
      {label}
    </Chip>
  )
}

function LogPanel({ id }: { id: string }) {
  const { openPanel } = usePanelContext()
  const { data, isLoading, error } = useApiRequestsControllerGetOne(id)
  const log: any = (data?.data as any) || null

  if (isLoading) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-feedback-danger-main">Failed to load request log</p>
      </div>
    )
  }

  const hasQuery = log.query && Object.keys(log.query).length > 0
  const hasBody = log.requestBody && Object.keys(log.requestBody).length > 0
  const hasSource = !!(log.source)
  const hasEvents = (log.events?.length ?? 0) > 0

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="shrink-0 mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <LogMethodChip method={log.method} />
          <LogStatusChip status={log.status} />
        </div>
        <p className="text-sm font-mono text-content-primary break-all leading-snug">{log.path}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs font-mono text-content-tertiary truncate">{log.id}</span>
          <CopyButton text={log.id} />
        </div>
        <p className="text-[10px] text-content-tertiary mt-1">{formatDatetime(log.createdAt)}</p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 space-y-6">

        {/* Overview */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Details</p>
          <dl className="space-y-2.5">
            {log.apiVersion && (
              <SectionRow label="API Version">
                <span className="text-xs font-mono bg-surface-secondary border border-border-primary-light px-2 py-0.5 rounded">{log.apiVersion}</span>
              </SectionRow>
            )}
            {log.secretKey && (
              <SectionRow label="Secret Key">
                <span className="font-mono text-xs text-content-tertiary">{log.secretKey}</span>
              </SectionRow>
            )}
            {log.initiator && (
              <SectionRow label="Initiator">
                <span className="font-mono text-xs text-content-tertiary">{log.initiator}</span>
              </SectionRow>
            )}
          </dl>
        </div>

        {/* Source */}
        {hasSource && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Source</p>
            <dl className="space-y-2.5">
              {log.source.ipAddress && (
                <SectionRow label="IP Address">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs">{log.source.ipAddress}</span>
                    <CopyButton text={log.source.ipAddress} />
                  </div>
                </SectionRow>
              )}
              {(log.source.client as any)?.name && (
                <SectionRow label="Client">{String((log.source.client as any).name)}</SectionRow>
              )}
              {(log.source.os as any)?.name && (
                <SectionRow label="OS">{String((log.source.os as any).name)}</SectionRow>
              )}
              {log.source.device && (
                <SectionRow label="Device">{(log.source.device as any).name ?? '—'}</SectionRow>
              )}
              {log.source.location && (
                <SectionRow label="Location">
                  {[(log.source.location as any).city, (log.source.location as any).country]
                    .filter(Boolean).join(', ') || '—'}
                </SectionRow>
              )}
            </dl>
          </div>
        )}

        {/* Linked events */}
        {hasEvents && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-2">Linked Events</p>
            <div className="space-y-1.5">
              {log.events.map((eventId: string) => (
                <button
                  key={eventId}
                  onClick={() => openPanel('event', eventId)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-primary-light bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left cursor-pointer"
                >
                  <span className="font-mono text-xs text-content-secondary truncate">{eventId}</span>
                  <ChevronRight width={13} height={13} className="text-content-tertiary shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Query params */}
        {hasQuery && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-2">Query Parameters</p>
            <div className="rounded-xl overflow-hidden border border-border-primary-light">
              <pre
                className="px-4 py-3 text-[11px] font-mono bg-slate-950 text-slate-100 overflow-x-auto leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightJson(log.query) }}
              />
            </div>
          </div>
        )}

        {/* Request body */}
        {hasBody && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-2">Request Body</p>
            <div className="rounded-xl overflow-hidden border border-border-primary-light">
              <pre
                className="px-4 py-3 text-[11px] font-mono bg-slate-950 text-slate-100 overflow-x-auto leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightJson(log.requestBody) }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Event Panel ────────────────────────────────────────────────────────────

function highlightJson(json: unknown): string {
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
        if (/null/.test(match)) return `<span class="text-rose-400">${match}</span>`
        return `<span class="text-purple-400">${match}</span>`
      },
    )
}

function parseJsonSafe(value: unknown): unknown {
  try { return typeof value === 'string' ? JSON.parse(value) : value }
  catch { return value }
}

const ATTEMPT_STATUS_DOT: Record<string, string> = {
  success: 'bg-feedback-success-main',
  failed: 'bg-feedback-danger-main',
  pending: 'bg-feedback-information-main',
}

function attemptStatusLabel(code?: number | null) {
  if (!code) return 'pending'
  if (code >= 200 && code < 300) return 'success'
  return 'failed'
}

function EventAttemptRow({ attempt, expanded, onToggle }: { attempt: any; expanded: boolean; onToggle: () => void }) {
  const [tab, setTab] = useState<'request' | 'response'>('request')
  const status = attemptStatusLabel(attempt.statusCode)
  const dotClass = ATTEMPT_STATUS_DOT[status] ?? 'bg-content-quaternary'
  const codeClass =
    status === 'success' ? 'text-feedback-success-dark' :
      status === 'failed' ? 'text-feedback-danger-main' :
        'text-content-secondary'
  const activeContent = tab === 'request' ? attempt.requestBody : attempt.responseBody

  return (
    <div className="border border-border-primary-light rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary transition-colors text-left cursor-pointer"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
          <div>
            <p className="text-[10px] text-content-tertiary mb-0.5">Timestamp</p>
            <p className="text-xs text-content-primary whitespace-nowrap">{formatDatetime(attempt.createdAt)}</p>
          </div>
          <div>
            <p className="text-[10px] text-content-tertiary mb-0.5">Status</p>
            <p className={`text-xs font-mono font-semibold ${codeClass}`}>{attempt.statusCode ?? 'Pending'}</p>
          </div>
        </div>
        {expanded
          ? <ChevronUp width={14} height={14} className="text-content-tertiary shrink-0" />
          : <ChevronDown width={14} height={14} className="text-content-tertiary shrink-0" />
        }
      </button>

      {expanded && (
        <div className="border-t border-border-primary-light">
          {attempt.url && (
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 shrink-0">URL</span>
              <span className="text-[11px] font-mono text-slate-300 break-all">{attempt.url}</span>
            </div>
          )}
          <div className="flex items-center border-b border-slate-800 bg-slate-950">
            {(['request', 'response'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={(e) => { e.stopPropagation(); setTab(t) }}
                className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${tab === t ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                {t === 'request' ? 'Request' : 'Response'}
                {t === 'response' && attempt.statusCode && (
                  <span className={`font-mono text-[10px] font-bold ${tab === 'response' ? codeClass : 'text-slate-500'}`}>
                    {attempt.statusCode}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="bg-slate-950 p-4">
            <pre
              className="text-[11px] leading-relaxed text-slate-100 overflow-auto whitespace-pre min-h-32 max-h-72"
              dangerouslySetInnerHTML={{
                __html: highlightJson(parseJsonSafe(activeContent)) || '<span class="text-slate-500 italic">No data</span>',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function EventPanel({ id }: { id: string }) {
  const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null)

  const { data: eventRes, isLoading, error } = useEventsControllerGetOne(id, {
    expand: 'attempts' as any,
  } as any)
  const event: any = (eventRes?.data as any) || null

  const retryMutation = useEventsControllerRetryEvent()

  async function handleRetry() {
    try {
      await retryMutation.mutateAsync({ id })
      toast({ title: 'Event queued for retry', variant: 'success' } as any)
    } catch (err: any) {
      toast({ title: 'Retry failed', description: err?.message ?? 'Something went wrong.', variant: 'error' } as any)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-feedback-danger-main">Failed to load event</p>
      </div>
    )
  }

  const attempts: any[] = event.attempts ?? []
  const isSynced = event.sync === true

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Toaster />

      {/* Header */}
      <div className="shrink-0 mb-6">
        <span className="text-lg font-bold font-mono text-content-primary break-all">{event.type}</span>
        <div className="flex items-center gap-2 mt-1.5 mb-3">
          <span className="text-xs font-mono text-content-tertiary truncate">{event.id}</span>
          <CopyButton text={event.id} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="status" value={event.body?.status ?? 'pending'} />
          <span className="text-[10px] text-content-tertiary font-medium">{formatRelativeTime(event.createdAt)}</span>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            color="secondary"
            size="sm"
            className="w-full gap-2 cursor-pointer"
            onClick={handleRetry}
            disabled={isSynced || retryMutation.isPending}
          >
            <RotateCcw width={13} height={13} />
            {retryMutation.isPending ? 'Retrying…' : 'Retry event'}
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 space-y-6">
        {/* Metadata */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Details</p>
          <dl className="space-y-2.5">
            <SectionRow label="Created">{formatDatetime(event.createdAt)}</SectionRow>
            <SectionRow label="Event type">
              <span className="font-mono text-xs">{event.type}</span>
            </SectionRow>
            {event.body?.amount != null && (
              <SectionRow label="Amount">
                <span className="tabular-nums">{formatAmount(event.body.amount, event.body.currency)}</span>
              </SectionRow>
            )}
            {event.body?.currency && (
              <SectionRow label="Currency">{event.body.currency}</SectionRow>
            )}
            {event.body?.channel && (
              <SectionRow label="Channel">{event.body.channel}</SectionRow>
            )}
            {event.source && (
              <SectionRow label="Source ID">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs truncate">{event.source}</span>
                  <CopyButton text={event.source} />
                </div>
              </SectionRow>
            )}
          </dl>
        </div>

        {/* Delivery attempts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary">
              Attempts
            </p>
            <span className="text-xs text-content-tertiary tabular-nums">
              {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
            </span>
          </div>
          {attempts.length === 0 ? (
            <p className="text-sm text-content-tertiary text-center py-6">No delivery attempts yet.</p>
          ) : (
            <div className="space-y-2">
              {attempts.map((attempt: any, i: number) => (
                <EventAttemptRow
                  key={attempt.id || i}
                  attempt={attempt}
                  expanded={expandedAttempt === i}
                  onToggle={() => setExpandedAttempt((prev) => (prev === i ? null : i))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <dt className="text-xs font-medium text-content-tertiary w-32 shrink-0">{label}</dt>
      <dd className="text-sm text-content-primary font-medium flex-1 min-w-0">{children}</dd>
    </div>
  )
}

function CustomerDetail({ customer }: { customer: any }) {
  const { openPanel } = usePanelContext()
  const info = customer.type === 'business'
    ? (customer.claims?.businessInformation ?? {})
    : (customer.claims?.individualInformation ?? {})

  const { data: accountsData, isLoading: accountsLoading } = useAccountControllerGet({
    limit: 20,
    expand: ['balance'] as any,
    filter: `customer|eq|${customer.id}` as any,
  } as any)
  const accounts = (accountsData?.data as any) || []

  function accountIcon(acc: any) {
    if (acc.type === 'fiat' || acc.type === 'virtual') return <Landmark size={13} className="text-content-tertiary" />
    if (acc.type === 'wallet' || acc.type === 'crypto') return <Network size={13} className="text-content-tertiary" />
    return <Network size={13} className="text-content-tertiary" />
  }

  return (
    <div>
      {/* ── Header ───────────────────────────────────────── */}
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold text-content-primary leading-snug">
          {customer.name || <span className="text-content-tertiary font-normal">No name</span>}
        </h2>
        <div className="text-xs font-mono text-content-tertiary mt-0.5 mb-3">{customer.id}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="type" value={customer.type} />
          <Badge variant="status" value={customer.status} />
        </div>
      </div>

      <div className="border-t border-border-primary-light mb-6" />

      {/* ── Profile ──────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3">Profile</p>
        <dl className="space-y-2.5">
          {customer.reference && (
            <SectionRow label="Reference">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{customer.reference}</span>
                <CopyButton text={customer.reference} />
              </div>
            </SectionRow>
          )}
          <SectionRow label="Email">
            {info.email ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-content-primary font-medium flex-1 min-w-0" >{info.email}</span>
                <CopyButton text={info.email} />
              </div>
            ) : <span className="text-content-tertiary">—</span>}
          </SectionRow>
          <SectionRow label="Phone">
            {info.phoneNumber ?? <span className="text-content-tertiary">—</span>}
          </SectionRow>
          <SectionRow label="ID">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm truncate">{customer.id}</span>
              <CopyButton text={customer.id} />
            </div>
          </SectionRow>
          {customer.createdAt && (
            <SectionRow label="Created">
              <span className="text-sm text-content-primary font-medium flex-1 min-w-0">{formatDate(customer.createdAt)}</span>
            </SectionRow>
          )}
        </dl>
      </div>

      {/* ── Accounts ─────────────────────────────────────── */}
      <div className="-mx-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-3 px-6">Accounts</p>
        {accountsLoading ? (
          <div className="space-y-2 px-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-content-tertiary px-6">No accounts linked to this customer.</p>
        ) : accounts.map((acc: any) => (
          <button
            key={acc.id}
            className="w-full flex items-center gap-3 py-3 px-6 border-b border-border-primary-light last:border-0 hover:bg-surface-secondary transition-colors text-left"
            onClick={() => openPanel('account', acc.id)}
          >
            <div className="shrink-0 w-7 h-7 flex items-center justify-center">
              {accountIcon(acc)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-content-primary truncate">
                {acc.label || acc.name || <span className="text-content-tertiary font-normal">Unnamed account</span>}
              </div>
              <div className="text-[11px] font-mono text-content-tertiary truncate">
                {acc.addressShort || acc.id}
              </div>
            </div>
            <div className="text-sm font-semibold tabular-nums shrink-0 text-content-primary">
              {acc.balance?.available != null
                ? formatAmount(acc.balance.available, acc.balance.currency ?? acc.currency)
                : '—'}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Payment Request Panel ────────────────────────────────────────────────────

function PaymentRequestPanel({ id }: { id: string }) {
  const { data, isLoading } = usePaymentRequestControllerGetOne(id)
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  const req = (data as any)?.data ?? (data as any)
  if (!req) return null

  const methodData = req.methodData?.bankTransfer ?? req.methodData?.transfer ?? req.methodData?.fxTransfer

  return (
    <div className="space-y-6">
      {/* Amount hero */}
      <div className="text-center py-4">
        <p className="text-xs text-content-tertiary uppercase tracking-widest mb-1">Amount</p>
        <p className="text-3xl font-bold text-content-primary">
          {req.currency} {req.amount != null ? (req.amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '—'}
        </p>
        {req.status && (
          <div className="mt-2 flex justify-center">
            <Badge variant="status" value={req.status} />
          </div>
        )}
      </div>

      <div className="border-t border-border-primary-light" />

      {/* Customer */}
      {req.customer && (
        <PanelSection title="Customer">
          <PanelRow label="Name">
            <button
              onClick={() => router.push(`/dashboard/customers/${req.customer.id}`)}
              className="text-right link"
            >
              {req.customer.name}
            </button>
          </PanelRow>
          {req.customer.id && (
            <PanelRow label="ID">
              <div className="flex items-center gap-2 justify-end">
                <span className="font-mono text-xs truncate max-w-28">{req.customer.id}</span>
                <CopyButton text={req.customer.id} />
              </div>
            </PanelRow>
          )}
        </PanelSection>
      )}

      {/* Account */}
      {req.account && (
        <PanelSection title="Account">
          {req.account.name && <PanelRow label="Name">{req.account.name}</PanelRow>}
          {req.account.type && <PanelRow label="Type"><span className="capitalize">{req.account.type} account</span></PanelRow>}
        </PanelSection>
      )}

      {/* Method */}
      <PanelSection title="Payment Method">
        {req.method && <PanelRow label="Method"><span className="capitalize">{req.method.replace(/-/g, ' ')}</span></PanelRow>}
        {req.currency && <PanelRow label="Currency">{req.currency}</PanelRow>}
        {req.reference && (
          <PanelRow label="Reference">
            <div className="flex items-center gap-2 justify-end">
              <span className="font-mono text-xs truncate max-w-28">{req.reference}</span>
              <CopyButton text={req.reference} />
            </div>
          </PanelRow>
        )}
      </PanelSection>

      {/* Method data */}
      {methodData && (
        <PanelSection title="Transfer Details">
          {methodData.accountName && <PanelRow label="Account Name">{methodData.accountName}</PanelRow>}
          {methodData.accountNumber && (
            <PanelRow label="Account Number">
              <div className="flex items-center gap-2 justify-end">
                <span className="font-mono text-sm">{methodData.accountNumber}</span>
                <CopyButton text={methodData.accountNumber} />
              </div>
            </PanelRow>
          )}
          {methodData.bankName && <PanelRow label="Bank Name">{methodData.bankName}</PanelRow>}
        </PanelSection>
      )}

      {/* Metadata */}
      {req.metadata && Object.keys(req.metadata).length > 0 && (
        <PanelSection title="Metadata">
          {Object.entries(req.metadata).map(([k, v]) => (
            <PanelRow key={k} label={k}>{String(v)}</PanelRow>
          ))}
        </PanelSection>
      )}

      {/* Timestamps */}
      <PanelSection title="Details">
        {req.createdAt && <PanelRow label="Created">{formatDatetime(req.createdAt)}</PanelRow>}
        <PanelRow label="ID">
          <div className="flex items-center gap-2 justify-end">
            <span className="font-mono text-xs truncate max-w-28">{req.id}</span>
            <CopyButton text={req.id} />
          </div>
        </PanelRow>
      </PanelSection>
    </div>
  )
}
