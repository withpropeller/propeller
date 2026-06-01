'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import {
  Button,
  TextInput,
  PinInput,
  Field,
  FieldLabel,
  FieldDescription,
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
import { useCardControllerActivateCard } from '@/apiu/cards/cards'
import { useQueryClient } from '@tanstack/react-query'

interface ActivateCardModalProps {
  cardId: string
  onClose: () => void
}

export function ActivateCardModal({ cardId, onClose }: ActivateCardModalProps) {
  const queryClient = useQueryClient()
  const [cvv, setCvv] = useState('')
  const [pin, setPin] = useState('')
  const { mutate: activateCard, isPending } = useCardControllerActivateCard()

  const canSubmit = pin.length === 4 && !isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    activateCard(
      { id: cardId, data: { pin, ...(cvv ? { cvv } : {}) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            predicate: (query) => (query.queryKey[0] as string)?.startsWith('/cards'),
          })
          toast({ title: 'Card activated successfully', severity: 'success' })
          onClose()
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to activate card',
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
          <ModalDialogTitle>Activate card</ModalDialogTitle>
          <ModalDialogDescription>
            Enter the card CVV and set a 4-digit PIN to activate this card.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form id="activate-card-form" onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-5">
            {/* CVV */}
            <Field>
              <FieldLabel htmlFor="activate-cvv">
                Card CVV{' '}
                <span className="text-content-tertiary font-normal">(optional)</span>
              </FieldLabel>
              <TextInput
                id="activate-cvv"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv((e.target as HTMLInputElement).value.replace(/\D/g, ''))}
                placeholder="3 or 4 digit number at the back of the card"
                className="w-full"
                autoFocus
              />
            </Field>

            {/* PIN */}
            <Field>
              <FieldLabel>Card PIN</FieldLabel>
              <PinInput
                id="activate-pin"
                pinLength={4}
                mask
                type="number"
                value={pin}
                onChange={(v) => typeof v === 'string' && setPin(v)}
              />
              <FieldDescription>This PIN will be used for future card transactions.</FieldDescription>
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
              disabled={!canSubmit}
              className="cursor-pointer gap-2"
            >
              <Zap width={15} height={15} /> Activate Card
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}
