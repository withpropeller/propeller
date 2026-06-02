'use client'

import { useState, useEffect } from 'react'
import { Link2, X } from 'lucide-react'
import {
  Button,
  TextInput,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Checkbox,
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
import { useQueryClient } from '@tanstack/react-query'
import { customInstance } from '@/lib/orvalClient'

const EVENT_GROUPS = [
  {
    label: 'Payment',
    events: [
      { value: 'payment.completed', label: 'Payment completed' },
      { value: 'payment.authorization.approved', label: 'Authorization approved' },
      { value: 'payment.authorization.activated', label: 'Authorization activated' },
    ],
  },
  {
    label: 'Request',
    events: [
      { value: 'request.completed', label: 'Request completed' },
      { value: 'request.cancelled', label: 'Request cancelled' },
    ],
  },
]

const ALL_EVENTS = EVENT_GROUPS.flatMap((g) => g.events)
const API_VERSIONS = ['2023-02-01', '2024-05-01', '2025-06-01']

interface AddEndpointModalProps {
  initialWebhook?: any
  onClose: () => void
  onSuccess?: () => void
}

export function AddEndpointModal({ initialWebhook, onClose, onSuccess }: AddEndpointModalProps) {
  const isEdit = !!initialWebhook
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    description: '',
    url: '',
    signingKey: '',
    apiVersion: '2025-06-01',
  })
  const [events, setEvents] = useState<string[]>([])

  useEffect(() => {
    if (initialWebhook) {
      setForm({
        name: initialWebhook.name ?? '',
        description: initialWebhook.description ?? '',
        url: initialWebhook.url ?? '',
        signingKey: '',
        apiVersion: initialWebhook.apiVersion ?? '2025-06-01',
      })
      setEvents(initialWebhook.events ?? [])
    }
  }, [initialWebhook])

  const [submitting, setSubmitting] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleEvent(value: string) {
    setEvents((prev) => (prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]))
  }

  function toggleGroup(group: (typeof EVENT_GROUPS)[0]) {
    const groupValues = group.events.map((e) => e.value)
    const allSelected = groupValues.every((v) => events.includes(v))
    if (allSelected) {
      setEvents((prev) => prev.filter((e) => !groupValues.includes(e)))
    } else {
      setEvents((prev) => [...new Set([...prev, ...groupValues])])
    }
  }

  const canSubmit = form.name.trim() && form.url.trim() && events.length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      url: form.url.trim(),
      apiVersion: form.apiVersion,
      events,
      ...(form.signingKey.trim() ? { signingKey: form.signingKey.trim() } : {}),
    } as any

    setSubmitting(true)
    try {
      if (isEdit) {
        await customInstance(`/webhooks/${initialWebhook.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        toast({ title: 'Endpoint updated', severity: 'success' })
      } else {
        await customInstance('/webhooks', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast({ title: 'Endpoint added', severity: 'success' })
      }
      queryClient.invalidateQueries({ queryKey: ['webhook'] })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: isEdit ? 'Failed to update endpoint' : 'Failed to add endpoint',
        description: err?.message ?? 'Something went wrong.',
        severity: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ModalDialog open={true} onOpenChange={(open) => !open && onClose()}>
        <ModalDialogContent size="sm" showCloseButton={false}>
          <ModalDialogHeader className="gap-1">
            <ModalDialogTitle>
              {isEdit ? 'Edit endpoint' : 'Add endpoint'}
            </ModalDialogTitle>
            <ModalDialogDescription>
              {isEdit
                ? 'Update your webhook configuration'
                : 'Register a new webhook URL to receive events'}
            </ModalDialogDescription>
            <ModalDialogClose asChild>
              <button
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-md text-content-tertiary hover:bg-surface-secondary hover:text-content-primary transition-colors cursor-pointer"
              >
                <X width={16} height={16} strokeWidth={1.5} />
              </button>
            </ModalDialogClose>
          </ModalDialogHeader>

          <ModalDialogBody>
            <form id="add-endpoint-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="webhook-name">
                  Webhook name <span className="text-feedback-danger-main">*</span>
                </Label>
                <TextInput
                  id="webhook-name"
                  value={form.name}
                  onChange={(e) => set('name', (e.target as HTMLInputElement).value)}
                  placeholder="e.g. Production payment events"
                  autoFocus
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="webhook-description">
                  Description{' '}
                  <span className="text-content-tertiary text-xs font-normal">(optional)</span>
                </Label>
                <TextInput
                  id="webhook-description"
                  value={form.description}
                  onChange={(e) => set('description', (e.target as HTMLInputElement).value)}
                  placeholder="What is this webhook for?"
                  className="w-full"
                />
              </div>

              {/* URL */}
              <div className="space-y-1.5">
                <Label htmlFor="webhook-url">
                  Endpoint URL <span className="text-feedback-danger-main">*</span>
                </Label>
                <div className="relative">
                  <Link2
                    width={14}
                    height={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary pointer-events-none"
                  />
                  <TextInput
                    id="webhook-url"
                    type="url"
                    value={form.url}
                    onChange={(e) => set('url', (e.target as HTMLInputElement).value)}
                    placeholder="https://api.yourapp.com/webhooks"
                    className="w-full pl-8"
                  />
                </div>
                <p className="text-xs text-content-tertiary">
                  Must be publicly accessible and respond with 2xx.
                </p>
              </div>

              {/* API Version */}
              <div className="space-y-1.5">
                <Label htmlFor="webhook-api-version">
                  API version <span className="text-feedback-danger-main">*</span>
                </Label>
                <Select value={form.apiVersion} onValueChange={(v) => set('apiVersion', v)}>
                  <SelectTrigger id="webhook-api-version" className="w-full">
                    <SelectValue placeholder="Select API version" />
                  </SelectTrigger>
                  <SelectContent>
                    {API_VERSIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Signing Key */}
              <div className="space-y-1.5">
                <Label htmlFor="webhook-signing-key">
                  Signing key{' '}
                  <span className="text-content-tertiary text-xs font-normal">(optional)</span>
                </Label>
                <TextInput
                  id="webhook-signing-key"
                  value={form.signingKey}
                  onChange={(e) => set('signingKey', (e.target as HTMLInputElement).value)}
                  placeholder={
                    isEdit ? 'Leave blank to keep current key' : 'Custom signing secret (max 80 chars)'
                  }
                  maxLength={80}
                  className="w-full"
                />
                <p className="text-xs text-content-tertiary">
                  Used to sign payloads via HMAC-SHA256. Auto-generated if left blank.
                </p>
              </div>

              {/* Events */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base">
                    Events <span className="text-feedback-danger-main">*</span>
                  </Label>
                  <div className="flex gap-5">
                    <Button
                      type="button"
                      variant="text"
                      color="primary"
                      size="sm"
                      onClick={() => setEvents(ALL_EVENTS.map((e) => e.value))}
                      className="cursor-pointer"
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      color="secondary"
                      size="sm"
                      onClick={() => setEvents([])}
                      className="cursor-pointer"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {EVENT_GROUPS.map((group) => {
                    const groupValues = group.events.map((e) => e.value)
                    const allSelected = groupValues.every((v) => events.includes(v))

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
                            className="cursor-pointer"
                          >
                            {allSelected ? 'Deselect all' : 'Select all'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {group.events.map((ev) => {
                            const checked = events.includes(ev.value)
                            const checkboxId = `event-${ev.value}`
                            return (
                              <label
                                key={ev.value}
                                htmlFor={checkboxId}
                                className={[
                                  'flex items-center gap-2 p-2 rounded-lg border text-sm text-content-secondary cursor-pointer transition-colors',
                                  checked
                                    ? 'bg-action-primary-subtle'
                                    : 'bg-surface-primary border-border-primary-light hover:border-border-primary-main hover:bg-surface-secondary',
                                ].join(' ')}
                              >
                                <Checkbox
                                  id={checkboxId}
                                  checked={checked}
                                  onCheckedChange={() => toggleEvent(ev.value)}
                                />
                                {ev.label}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {events.length === 0 && (
                  <p className="text-xs text-feedback-danger-main">Select at least one event.</p>
                )}
                {events.length > 0 && (
                  <p className="text-xs text-content-tertiary">
                    {events.length} event{events.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </form>
          </ModalDialogBody>

          <ModalDialogFooter>
            <ModalDialogClose asChild>
              <Button variant="outline" color="secondary" className="cursor-pointer">
                Cancel
              </Button>
            </ModalDialogClose>
            <Button
              type="submit"
              form="add-endpoint-form"
              color="primary"
              disabled={!canSubmit}
              className="cursor-pointer"
            >
              {submitting
                ? isEdit
                  ? 'Saving…'
                  : 'Adding…'
                : isEdit
                  ? 'Save changes'
                  : 'Add endpoint'}
            </Button>
          </ModalDialogFooter>
        </ModalDialogContent>
      </ModalDialog>
    </>
  )
}
