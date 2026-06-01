'use client'

import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
import {
  Button,
  Field,
  FieldLabel,
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  toast,
} from '@/lib/pax'
import { useConfigurationControllerGet, useConfigurationControllerUpdatePayment } from '@/apiu/tools-configuration/tools-configuration'
import { useAccountControllerGet } from '@/apiu/accounts/accounts'
import { useQueryClient } from '@tanstack/react-query'

interface Props {
  onClose: () => void
}

export function ConfigurePaymentsModal({ onClose }: Props) {
  const queryClient = useQueryClient()

  const [payInAccount, setPayInAccount] = useState('')
  const [payOutAccount, setPayOutAccount] = useState('')

  // Current config — pre-populate fields
  const { data: configRes, isLoading: isLoadingConfig } = useConfigurationControllerGet()
  const config = (configRes?.data as any) || null

  useEffect(() => {
    if (config) {
      if (config.payInAccount) setPayInAccount(typeof config.payInAccount === 'string' ? config.payInAccount : config.payInAccount?.id ?? '')
      if (config.payOutAccount) setPayOutAccount(typeof config.payOutAccount === 'string' ? config.payOutAccount : config.payOutAccount?.id ?? '')
    }
  }, [config])

  // Accounts for selects
  const { data: accountsRes } = useAccountControllerGet(
    { limit: 50, expand: ['depositChannels'] as any } as any,
  )
  const accounts: any[] = (accountsRes?.data as any) || []

  const accountOptions = accounts.map((a: any) => {
    const channel = a.depositChannels?.[0]
    const suffix = channel ? ` — ${channel.accountNumber} (${channel.bankName})` : ''
    return { label: `${a.name}${suffix}`, value: a.id }
  })

  const { mutate: updateConfig, isPending } = useConfigurationControllerUpdatePayment()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!payInAccount && !payOutAccount) {
      toast({ title: 'No changes to save', description: 'Please select at least one account.', severity: 'danger' })
      return
    }

    const payload: any = {}
    if (payInAccount) payload.payInAccount = payInAccount
    if (payOutAccount) payload.payOutAccount = payOutAccount

    updateConfig(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            predicate: (query) => (query.queryKey[0] as string)?.startsWith('/tools/configuration'),
          })
          toast({ title: 'Payment configurations saved', severity: 'success' })
          onClose()
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to save configurations',
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
          <ModalDialogTitle>Payment settings</ModalDialogTitle>
          <ModalDialogDescription>
            Configure the default accounts for your payment flows.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form id="configure-payments-form" onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-6">
            {isLoadingConfig ? (
              <div className="space-y-6">
                {[0, 1].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-36 bg-surface-secondary rounded animate-pulse" />
                    <div className="h-4 w-56 bg-surface-secondary rounded animate-pulse" />
                    <div className="h-10 w-full bg-surface-secondary rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Field>
                  <div className="flex items-center gap-1">
                    <FieldLabel htmlFor="config-pay-in">Default source account</FieldLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button" className="text-content-tertiary hover:text-content-secondary transition-colors">
                          <Info size={13} />
                        </TooltipTrigger>
                        <TooltipContent>Choose the default source for your future payments.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select value={payInAccount} onValueChange={setPayInAccount}>
                    <SelectTrigger id="config-pay-in">
                      <SelectValue placeholder="Search for an account" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56 overflow-y-auto">
                      {accountOptions.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <div className="flex items-center gap-1">
                    <FieldLabel htmlFor="config-pay-out">Default destination account</FieldLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button" className="text-content-tertiary hover:text-content-secondary transition-colors">
                          <Info size={13} />
                        </TooltipTrigger>
                        <TooltipContent>Choose the default account for receiving future payments.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select value={payOutAccount} onValueChange={setPayOutAccount}>
                    <SelectTrigger id="config-pay-out">
                      <SelectValue placeholder="Search for an account" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56 overflow-y-auto">
                      {accountOptions.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}
          </ModalDialogBody>

          <ModalDialogFooter className="pt-6">
            <ModalDialogClose asChild>
              <Button variant="outline" color="secondary" type="button" onClick={onClose} className="cursor-pointer">
                Cancel
              </Button>
            </ModalDialogClose>
            <Button color="primary" type="submit" form="configure-payments-form" disabled={isPending || isLoadingConfig} className="cursor-pointer">
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}
