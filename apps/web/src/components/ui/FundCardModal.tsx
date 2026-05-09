'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import {
  Button,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  TextInput,
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

interface FundCardModalProps {
  cardId: string
  currency?: string
  fundingSourceLabel?: string
  onClose: () => void
}

export function FundCardModal({
  cardId,
  currency = 'NGN',
  fundingSourceLabel,
  onClose,
}: FundCardModalProps) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [formErrors, setFormErrors] = useState<{ amount?: string }>({})


  function validate() {
    const errs: { amount?: string } = {}
    const num = Number(amount)
    if (!amount.trim() || isNaN(num) || num <= 0) {
      errs.amount = 'Enter a valid amount greater than 0.'
    }
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    /**
     *  fundCard(
      {
        data: { amount: Math.round(Number(amount) * 100), },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            predicate: (query) => (query.queryKey[0] as string)?.startsWith('/cards'),
          })
          toast({ title: 'Card funded successfully', severity: 'success' })
          onClose()
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to fund card',
            description: err?.message ?? 'Something went wrong.',
            severity: 'danger',
          })
        },
      },
    )
     * 
     */
   
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Fund card</ModalDialogTitle>
          <ModalDialogDescription>
            Transfer funds to this card
            {fundingSourceLabel ? ` from ${fundingSourceLabel}` : ''}.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form id="fund-card-form" onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-5">
            <Field>
              <FieldLabel htmlFor="fund-amount">
                Amount ({currency}) <span className="text-feedback-danger-main">*</span>
              </FieldLabel>
              <TextInput
                id="fund-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount((e.target as HTMLInputElement).value)
                  if (formErrors.amount) setFormErrors({})
                }}
                placeholder={`Enter amount in ${currency}`}
                className="w-full"
                autoFocus
              />
              {formErrors.amount ? (
                <FieldError errors={[{ message: formErrors.amount }]} />
              ) : (
                <FieldDescription>
                  Amount will be debited from your funding pool and credited to this card.
                </FieldDescription>
              )}
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
              className="cursor-pointer gap-2"
            >
              <Wallet width={15} height={15} /> Fund card
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}
