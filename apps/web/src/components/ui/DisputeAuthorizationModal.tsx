'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  Button,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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
import { useDisputeControllerCreate } from '@/api/disputes/disputes'
import { useQueryClient } from '@tanstack/react-query'
import type { CreateDisputeDtoReason } from '@/api/model'

const DISPUTE_REASONS: { label: string; value: CreateDisputeDtoReason }[] = [
  { label: 'Fraudulent transaction', value: 'fraudulent' },
  { label: 'Duplicate transaction', value: 'duplicate' },
  { label: 'Value not received', value: 'value-not-received' },
  { label: 'General', value: 'general' },
]

interface DisputeAuthorizationModalProps {
  authorizationId: string
  onClose: () => void
}

export function DisputeAuthorizationModal({ authorizationId, onClose }: DisputeAuthorizationModalProps) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState<CreateDisputeDtoReason | ''>('')
  const [text, setText] = useState('')

  const { mutate: createDispute, isPending } = useDisputeControllerCreate()
  const [formErrors, setFormErrors] = useState<{ reason?: string }>({})

  function validate() {
    const errs: { reason?: string } = {}
    if (!reason) errs.reason = 'Please select a reason for the dispute.'
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    createDispute(
      {
        data: {
          source: authorizationId as any,
          reason: reason as CreateDisputeDtoReason,
          ...(text.trim() ? { text: text.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            predicate: (query) => (query.queryKey[0] as string)?.startsWith('/card-authorizations'),
          })
          toast({ title: 'Dispute submitted', severity: 'success' })
          onClose()
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to submit dispute',
            description: err?.message ?? 'Something went wrong.',
            severity: 'danger',
          })
        },
      },
    )
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Dispute authorization</ModalDialogTitle>
          <ModalDialogDescription>
            Submit a dispute for this authorization. Our team will review and follow up.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form id="dispute-authorization-form" onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-5">
            {/* Source — read-only context */}
            <Field>
              <FieldLabel>Authorization</FieldLabel>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary border border-border-primary-light text-sm font-mono text-content-secondary">
                <AlertCircle width={13} height={13} className="text-content-quaternary shrink-0" />
                {authorizationId}
              </div>
            </Field>

            {/* Reason */}
            <Field>
              <FieldLabel htmlFor="dispute-reason">
                Reason <span className="text-feedback-danger-main">*</span>
              </FieldLabel>
              <Select value={reason} onValueChange={(v) => setReason(v as CreateDisputeDtoReason)}>
                <SelectTrigger id="dispute-reason" className="w-full">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {DISPUTE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.reason && <FieldError errors={[{ message: formErrors.reason }]} />}
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="dispute-text">
                Description{' '}
                <span className="text-content-tertiary font-normal">(optional)</span>
              </FieldLabel>
              <Textarea
                id="dispute-text"
                value={text}
                onChange={(e) => setText((e.target as HTMLTextAreaElement).value)}
                placeholder="Describe why you are disputing this authorization…"
                rows={4}
                className="w-full resize-none"
              />
              <FieldDescription>
                Additional context helps resolve your dispute faster.
              </FieldDescription>
            </Field>
          </ModalDialogBody>

          <ModalDialogFooter className="pt-6">
            <ModalDialogClose asChild>
              <Button type="button" variant="outline" color="secondary" className="cursor-pointer">
                Cancel
              </Button>
            </ModalDialogClose>
            <Button
              type="submit"
              color="primary"
              loading={isPending}
              disabled={isPending}
              className="cursor-pointer gap-2"
            >
              <AlertCircle width={15} height={15} /> Submit Dispute
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}
