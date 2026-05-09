'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  Button,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  TextInput,
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
import { useAccountControllerGet, useAccountControllerGetBalance } from '@/api/accounts/accounts'
import { useToolsControllerGetBanks, useToolsControllerResolveBankAccount } from '@/api/tools/tools'
import { usePaymentControllerPayout } from '@/api/payments/payments'
import { useQueryClient } from '@tanstack/react-query'
import { formatAmount } from '@/lib/format'

const METHODS = [
  { label: 'Local Transfer (between accounts)', value: 'local-transfer' },
  { label: 'Bank Transfer', value: 'bank-transfer' },
]

const CURRENCIES = [
  { label: 'NGN — Nigerian Naira', value: 'NGN' },
  { label: 'USD — US Dollar', value: 'USD' },
]

interface FormErrors {
  method?: string
  currency?: string
  amount?: string
  debitSource?: string
  destination?: string
  accountNumber?: string
  bankCode?: string
}

interface Props {
  onClose: () => void
}

export function NewPayoutModal({ onClose }: Props) {
  const queryClient = useQueryClient()

  const [method, setMethod] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [amount, setAmount] = useState('')
  const [debitSource, setDebitSource] = useState('')
  const [destination, setDestination] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [narration, setNarration] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})


  // Accounts for debit source + destination selects
  const { data: accountsRes } = useAccountControllerGet(
    { limit: 50, expand: ['depositChannels'] as any } as any,
  )
  const accounts: any[] = (accountsRes?.data as any) || []

  const accountOptions = accounts.map((a: any) => {
    const channel = a.depositChannels?.[0]
    const suffix = channel ? ` — ${channel.accountNumber} (${channel.bankName})` : ''
    return { label: `${a.name}${suffix}`, value: a.id }
  })

  // Balance of selected debit source
  const { data: balanceRes } = useAccountControllerGetBalance(debitSource, {
    query: { enabled: !!debitSource },
  })
  const balance = (balanceRes?.data as any)?.balance

  const { mutate: createPayout, isPending } = usePaymentControllerPayout()

  // Banks list for bank-transfer
  const { data: banksRes } = useToolsControllerGetBanks({
    query: { enabled: method === 'bank-transfer' },
  })
  const banks: any[] = (banksRes?.data as any) || []

  // Resolve bank account name when accountNumber (10 digits) + bankCode are both set
  const canResolve = method === 'bank-transfer' && accountNumber.length === 10 && !!bankCode
  const { data: resolvedRes, isFetching: isResolving } = useToolsControllerResolveBankAccount(
    { accountNumber, bankCode },
    { query: { enabled: canResolve } },
  )
  const resolvedAccountName = (resolvedRes?.data as any)?.accountName

  // Reset destination / bank fields when method changes
  useEffect(() => {
    setDestination('')
    setAccountNumber('')
    setBankCode('')
    setFormErrors({})
  }, [method])

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!method) errs.method = 'Please select a payment method.'
    if (!currency) errs.currency = 'Please select a currency.'
    const num = Number(amount)
    if (!amount.trim() || isNaN(num) || num <= 0) errs.amount = 'Enter a valid amount greater than 0.'
    if (!debitSource) errs.debitSource = 'Please select a source account.'
    if (method === 'local-transfer' && !destination) errs.destination = 'Please select a destination account.'
    if (method === 'bank-transfer') {
      if (!accountNumber || accountNumber.length !== 10) errs.accountNumber = 'Enter a valid 10-digit account number.'
      if (!bankCode) errs.bankCode = 'Please select a bank.'
    }
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload: any = {
      method,
      currency,
      amount: Math.round(Number(amount) * 100),
      debitSource,
      options: {
        method,
        ...(narration.trim() ? { narration: narration.trim() } : {}),
        ...(method === 'local-transfer'
          ? { destination }
          : { accountNumber, bankCode }),
      },
    }

    createPayout(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            predicate: (query) => (query.queryKey[0] as string)?.startsWith('/payments'),
          })
          toast({ title: 'Payout created', severity: 'success' })
          onClose()
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to create payout',
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
          <ModalDialogTitle>Create new payout</ModalDialogTitle>
          <ModalDialogDescription>
            Provide the details of the payout request below.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form id="new-payout-form" onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-5 overflow-y-auto max-h-[55vh]">

            {/* Method */}
            <Field>
              <FieldLabel htmlFor="payout-method">
                Payment Method <span className="text-feedback-danger-main">*</span>
              </FieldLabel>
              <Select value={method} onValueChange={(v) => { setMethod(v); setFormErrors((p) => ({ ...p, method: undefined })) }}>
                <SelectTrigger id="payout-method">
                  <SelectValue placeholder="Select a method" />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.method && <FieldError>{formErrors.method}</FieldError>}
            </Field>

            {/* Currency + Amount side by side */}
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="payout-currency">
                  Currency <span className="text-feedback-danger-main">*</span>
                </FieldLabel>
                <Select value={currency} onValueChange={(v) => { setCurrency(v); setFormErrors((p) => ({ ...p, currency: undefined })) }}>
                  <SelectTrigger id="payout-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.currency && <FieldError>{formErrors.currency}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="payout-amount">
                  Amount <span className="text-feedback-danger-main">*</span>
                </FieldLabel>
                <TextInput
                  id="payout-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => { setAmount((e.target as HTMLInputElement).value); setFormErrors((p) => ({ ...p, amount: undefined })) }}
                />
                {formErrors.amount && <FieldError>{formErrors.amount}</FieldError>}
              </Field>
            </div>

            {/* Debit Source */}
            <Field>
              <FieldLabel htmlFor="payout-debit-source">
                Source Account <span className="text-feedback-danger-main">*</span>
              </FieldLabel>
              <Select value={debitSource} onValueChange={(v) => { setDebitSource(v); setFormErrors((p) => ({ ...p, debitSource: undefined })) }}>
                <SelectTrigger id="payout-debit-source">
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {debitSource && balance != null && (
                <FieldDescription>
                  Available balance: <span className="font-semibold">{formatAmount(balance, currency)}</span>
                </FieldDescription>
              )}
              {formErrors.debitSource && <FieldError>{formErrors.debitSource}</FieldError>}
            </Field>

            {/* local-transfer: Destination */}
            {method === 'local-transfer' && (
              <Field>
                <FieldLabel htmlFor="payout-destination">
                  Destination Account <span className="text-feedback-danger-main">*</span>
                </FieldLabel>
                <Select value={destination} onValueChange={(v) => { setDestination(v); setFormErrors((p) => ({ ...p, destination: undefined })) }}>
                  <SelectTrigger id="payout-destination">
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountOptions
                      .filter((a) => a.value !== debitSource)
                      .map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formErrors.destination && <FieldError>{formErrors.destination}</FieldError>}
              </Field>
            )}

            {/* bank-transfer fields */}
            {method === 'bank-transfer' && (
              <>
                <Field>
                  <FieldLabel htmlFor="payout-account-number">
                    Account Number <span className="text-feedback-danger-main">*</span>
                  </FieldLabel>
                  <TextInput
                    id="payout-account-number"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0000000000"
                    value={accountNumber}
                    onChange={(e) => { setAccountNumber((e.target as HTMLInputElement).value.replace(/\D/g, '')); setFormErrors((p) => ({ ...p, accountNumber: undefined })) }}
                  />
                  {formErrors.accountNumber && <FieldError>{formErrors.accountNumber}</FieldError>}
                </Field>

                <Field>
                  <FieldLabel htmlFor="payout-bank">
                    Bank <span className="text-feedback-danger-main">*</span>
                  </FieldLabel>
                  <Select value={bankCode} onValueChange={(v) => { setBankCode(v); setFormErrors((p) => ({ ...p, bankCode: undefined })) }}>
                    <SelectTrigger id="payout-bank">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((b: any) => (
                        <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.bankCode && <FieldError>{formErrors.bankCode}</FieldError>}
                </Field>

                {/* Resolved account name feedback */}
                {canResolve && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary border border-border-primary-light text-sm">
                    {isResolving ? (
                      <span className="text-content-tertiary">Resolving account name…</span>
                    ) : resolvedAccountName ? (
                      <>
                        <CheckCircle2 width={15} height={15} className="text-feedback-success-main shrink-0" />
                        <span className="font-medium text-content-primary">{resolvedAccountName}</span>
                      </>
                    ) : (
                      <span className="text-feedback-danger-main">Could not resolve account. Check the number and bank.</span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Narration */}
            {method && (
              <Field>
                <FieldLabel htmlFor="payout-narration">Narration</FieldLabel>
                <TextInput
                  id="payout-narration"
                  placeholder="Optional note for this transfer"
                  value={narration}
                  onChange={(e) => setNarration((e.target as HTMLInputElement).value)}
                />
                <FieldDescription>This will appear on the recipient&apos;s statement.</FieldDescription>
              </Field>
            )}
          </ModalDialogBody>

          <ModalDialogFooter className="pt-6">
            <ModalDialogClose asChild>
              <Button variant="outline" color="secondary" type="button" onClick={onClose} className="cursor-pointer">
                Cancel
              </Button>
            </ModalDialogClose>
            <Button color="primary" type="submit" form="new-payout-form" disabled={isPending} className="cursor-pointer">
              {isPending ? 'Creating…' : 'Create payout'}
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}
