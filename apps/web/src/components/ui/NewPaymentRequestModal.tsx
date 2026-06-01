'use client'

import { useState } from 'react'
import { X, Info, Plus } from 'lucide-react'
import {
  Button,
  Chip,
  Field,
  FieldLabel,
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  toast,
} from '@/lib/pax'
import { usePaymentRequestControllerCreate } from '@/apiu/payment-requests/payment-requests'
import { useCustomerControllerGetAll } from '@/apiu/customers/customers'
import { useQueryClient } from '@tanstack/react-query'

const CURRENCIES = [
  { label: 'NGN — Nigerian Naira', value: 'NGN' },
  { label: 'USD — US Dollar', value: 'USD' },
]

const METHODS = [
  { label: 'Bank Transfer', value: 'bank-transfer' },
]

interface FormErrors {
  amount?: string
  currency?: string
  method?: string
  customer?: string
}

interface Props {
  onClose: () => void
}

export function NewPaymentRequestModal({ onClose }: Props) {
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [method, setMethod] = useState('')
  const [customer, setCustomer] = useState('')
  const [reference, setReference] = useState('')
  const [metaKey, setMetaKey] = useState('')
  const [metaValue, setMetaValue] = useState('')
  const [metadata, setMetadata] = useState<Array<{ key: string; value: string }>>([])
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const { data: customersRes } = useCustomerControllerGetAll({ limit: 100 } as any)
  const customers: any[] = (customersRes?.data as any) || []

  const { mutate: createRequest, isPending } = usePaymentRequestControllerCreate()

  function validate(): FormErrors {
    const errs: FormErrors = {}
    const num = Number(amount)
    if (!amount.trim() || isNaN(num) || num <= 0) errs.amount = 'Enter a valid amount greater than 0.'
    if (!currency) errs.currency = 'Please select a currency.'
    if (!method) errs.method = 'Please select a payment method.'
    if (!customer) errs.customer = 'Please select a customer.'
    return errs
  }

  function addMetadata() {
    if (!metaKey.trim() || !metaValue.trim()) return
    setMetadata((prev) => [...prev, { key: metaKey.trim(), value: metaValue.trim() }])
    setMetaKey('')
    setMetaValue('')
  }

  function removeMetadata(index: number) {
    setMetadata((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    const customerRecord = customers.find((c: any) => c.id === customer)

    const payload: any = {
      method,
      currency,
      amount: Math.round(Number(amount) * 100),
      customer,
      options: { name: customerRecord?.name ?? '' },
    }

    if (reference.trim()) payload.reference = reference.trim()
    if (metadata.length > 0) {
      payload.metadata = metadata.reduce((acc, m) => ({ ...acc, [m.key]: m.value }), {})
    }

    createRequest(
      { data: payload } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            predicate: (query) => (query.queryKey[0] as string)?.startsWith('/payment-requests'),
          })
          toast({ title: 'Payment request created', severity: 'success' })
          onClose()
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to create payment request',
            description: err?.message ?? 'Something went wrong.',
            severity: 'danger',
          })
        },
      },
    )
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="md" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>New payment request</ModalDialogTitle>
          <ModalDialogDescription>
            Provide the details of the payment request below.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form id="new-payment-request-form" onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-6">

            {/* Amount + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="req-currency">
                  Currency <span className="text-feedback-danger-main">*</span>
                </FieldLabel>
                <Select value={currency} onValueChange={(v) => { setCurrency(v); setFormErrors((p) => ({ ...p, currency: undefined })) }}>
                  <SelectTrigger id="req-currency">
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
                <FieldLabel htmlFor="req-amount">
                  Amount <span className="text-feedback-danger-main">*</span>
                </FieldLabel>
                <TextInput
                  id="req-amount"
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

            {/* Method */}
            <Field>
              <FieldLabel htmlFor="req-method">
                Method <span className="text-feedback-danger-main">*</span>
              </FieldLabel>
              <Select value={method} onValueChange={(v) => { setMethod(v); setFormErrors((p) => ({ ...p, method: undefined })) }}>
                <SelectTrigger id="req-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.method && <FieldError>{formErrors.method}</FieldError>}
            </Field>

            {/* Customer */}
            <Field>
              <FieldLabel htmlFor="req-customer">
                Customer <span className="text-feedback-danger-main">*</span>
              </FieldLabel>
              <Select value={customer} onValueChange={(v) => { setCustomer(v); setFormErrors((p) => ({ ...p, customer: undefined })) }}>
                <SelectTrigger id="req-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="max-h-56 overflow-y-auto">
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.customer && <FieldError>{formErrors.customer}</FieldError>}
            </Field>

            {/* Reference */}
            <Field>
              <FieldLabel htmlFor="req-reference">Reference</FieldLabel>
              <TextInput
                id="req-reference"
                placeholder="Optional unique reference"
                value={reference}
                onChange={(e) => setReference((e.target as HTMLInputElement).value)}
              />
            </Field>

            {/* Metadata */}
            <div className="space-y-3">
              <Field>
                <div className="flex items-center gap-1">
                  <FieldLabel>Request metadata</FieldLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger type="button" className="text-content-tertiary hover:text-content-secondary transition-colors">
                        <Info size={13} />
                      </TooltipTrigger>
                      <TooltipContent>Add key-value pairs for your team&apos;s usage.</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </Field>

              <div className="flex items-end gap-2">
                <Field className="flex-1">
                  <FieldLabel htmlFor="meta-key">Key</FieldLabel>
                  <TextInput
                    id="meta-key"
                    placeholder="e.g. orderId"
                    value={metaKey}
                    onChange={(e) => setMetaKey((e.target as HTMLInputElement).value)}
                  />
                </Field>
                <Field className="flex-1">
                  <FieldLabel htmlFor="meta-value">Value</FieldLabel>
                  <TextInput
                    id="meta-value"
                    placeholder="e.g. 12345"
                    value={metaValue}
                    onChange={(e) => setMetaValue((e.target as HTMLInputElement).value)}
                  />
                </Field>
              </div>

              <Button
                type="button"
                variant="text"
                color="primary"
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={addMetadata}
                disabled={!metaKey.trim() || !metaValue.trim()}
              >
                <Plus width={13} height={13} />
                Add
              </Button>

              {metadata.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {metadata.map((m, i) => (
                    <Chip key={i} variant="input" color="secondary" className="gap-1.5">
                      {m.key}: {m.value}
                      <button
                        type="button"
                        onClick={() => removeMetadata(i)}
                        className="hover:text-feedback-danger-main transition-colors cursor-pointer leading-none"
                      >
                        <X width={11} height={11} />
                      </button>
                    </Chip>
                  ))}
                </div>
              )}
            </div>

          </ModalDialogBody>

          <ModalDialogFooter className="pt-6">
            <ModalDialogClose asChild>
              <Button variant="outline" color="secondary" type="button" onClick={onClose} className="cursor-pointer">
                Cancel
              </Button>
            </ModalDialogClose>
            <Button color="primary" type="submit" form="new-payment-request-form" disabled={isPending} className="cursor-pointer">
              {isPending ? 'Creating…' : 'Create request'}
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}
