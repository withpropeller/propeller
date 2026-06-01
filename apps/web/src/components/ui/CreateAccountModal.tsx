'use client'

import { useState, useEffect } from 'react'
import {
  Button,
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
  toast,
} from '@/lib/pax'
import { useAccountControllerCreate, getAccountControllerGetQueryKey } from '@/apiu/accounts/accounts'
import { useCustomerControllerGetAll } from '@/apiu/customers/customers'
import { useQueryClient } from '@tanstack/react-query'
import type { CreateAccountDto } from '@/apiu/model'

const ACCOUNT_TYPES = [
  { label: 'Main Account', value: 'main' },
  { label: 'Sub Account', value: 'sub' },
  { label: 'Virtual Account', value: 'virtual' },
]

const CURRENCIES = [
  { label: 'NGN — Nigerian Naira', value: 'NGN' },
]

interface FormErrors {
  name?: string
  type?: string
  currency?: string
  customer?: string
}

interface Props {
  onClose: () => void
}

export function CreateAccountModal({ onClose }: Props) {
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [currency, setCurrency] = useState('')
  const [customer, setCustomer] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const needsCustomer = type === 'sub' || type === 'virtual'

  // Load customers when type requires it
  const { data: customersRes, isLoading: loadingCustomers } = useCustomerControllerGetAll(
    { limit: 50, ...(customerSearch ? { search: customerSearch } : {}) } as any,
    { query: { enabled: needsCustomer } },
  )
  const customers: any[] = (customersRes?.data as any) || []

  const { mutateAsync: createAccount, isPending } = useAccountControllerCreate()

  // Clear customer selection when type no longer requires it
  useEffect(() => {
    if (!needsCustomer) setCustomer('')
  }, [type, needsCustomer])

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!name.trim()) errs.name = 'Account name is required.'
    if (!type) errs.type = 'Please select an account type.'
    if (!currency) errs.currency = 'Please select a currency.'
    if (needsCustomer && !customer) errs.customer = 'Please select an account owner.'
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }

    const payload: CreateAccountDto = {
      name: name.trim(),
      type: type as CreateAccountDto['type'],
      currency: currency as CreateAccountDto['currency'],
      ...(customer ? { customer } : {}),
      ...(type === 'virtual' ? { depositChannels: ['bank-account' as any] } : {}),
    }

    try {
      await createAccount({ data: payload })
      await queryClient.invalidateQueries({ queryKey: getAccountControllerGetQueryKey() })
      toast({ title: 'Account created', description: `"${payload.name}" has been created successfully.`, severity: 'success' })
      onClose()
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Something went wrong.'
      toast({ title: 'Failed to create account', description: message, severity: 'danger' })
    }
  }

  return (
    <>
      <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
        <ModalDialogContent className="max-w-md">
          <ModalDialogHeader>
            <ModalDialogTitle>Create new account</ModalDialogTitle>
            <ModalDialogDescription>
              Provision a new financial wallet for a merchant or customer.
            </ModalDialogDescription>
          </ModalDialogHeader>

          <ModalDialogBody className="space-y-4">
            {/* Account Name */}
            <Field>
              <FieldLabel>Account Name <span className="text-red-500">*</span></FieldLabel>
              <TextInput
                placeholder="Name the account"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }))
                }}
              />
              {formErrors.name && <FieldError>{formErrors.name}</FieldError>}
            </Field>

            {/* Account Type */}
            <Field>
              <FieldLabel>Account Type <span className="text-red-500">*</span></FieldLabel>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v)
                  if (formErrors.type) setFormErrors((p) => ({ ...p, type: undefined }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.type && <FieldError>{formErrors.type}</FieldError>}
            </Field>

            {/* Currency */}
            <Field>
              <FieldLabel>Currency <span className="text-red-500">*</span></FieldLabel>
              <Select
                value={currency}
                onValueChange={(v) => {
                  setCurrency(v)
                  if (formErrors.currency) setFormErrors((p) => ({ ...p, currency: undefined }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.currency && <FieldError>{formErrors.currency}</FieldError>}
            </Field>

            {/* Customer (sub / virtual only) */}
            {needsCustomer && (
              <Field>
                <FieldLabel>Account Owner <span className="text-red-500">*</span></FieldLabel>
                {loadingCustomers ? (
                  <div className="h-9 rounded-md bg-surface-secondary animate-pulse" />
                ) : (
                  <Select
                    value={customer}
                    onValueChange={(v) => {
                      setCustomer(v)
                      if (formErrors.customer) setFormErrors((p) => ({ ...p, customer: undefined }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="py-3 px-2 text-sm text-content-tertiary text-center">No customers found</div>
                      ) : (
                        customers.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name || c.email || c.id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {formErrors.customer && <FieldError>{formErrors.customer}</FieldError>}
              </Field>
            )}
          </ModalDialogBody>

          <ModalDialogFooter>
            <ModalDialogClose asChild>
              <Button variant="outline" color="secondary" onClick={onClose}>
                Cancel
              </Button>
            </ModalDialogClose>
            <Button color="primary" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Creating…' : 'Create Account'}
            </Button>
          </ModalDialogFooter>
        </ModalDialogContent>
      </ModalDialog>
    </>
  )
}
