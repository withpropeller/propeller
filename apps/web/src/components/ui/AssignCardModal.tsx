'use client'

import { useState } from 'react'
import Link from '@/lib/routing'
import { ChevronRight } from 'lucide-react'
import {
  Button,
  ModalDialog,
  ModalDialogContent,
  ModalDialogHeader,
  ModalDialogTitle,
  ModalDialogDescription,
  ModalDialogBody,
  ModalDialogFooter,
  ModalDialogClose,
} from '@/lib/pax'
import { useCustomerControllerGetAll } from '@/api/customers/customers'
import { useAccountControllerGet } from '@/api/accounts/accounts'
import { SelectInput } from '@/components/ui/SelectInput'

interface AssignCardModalProps {
  onClose: () => void
  onAssign: (customerId: string, fundingSourceId?: string) => void
  fundingSourceType?: string
}

export function AssignCardModal({ onClose, onAssign, fundingSourceType }: AssignCardModalProps) {
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [assigning, setAssigning] = useState(false)

  const { data: customersRes, isLoading: isLoadingCustomers } = useCustomerControllerGetAll(
    { limit: 100, ...(search ? { filter: `name|like|${search}` } : {}) } as any,
  )
  const customers: any[] = (customersRes?.data as any) || []

  const needsFundingSource = fundingSourceType === 'card-account'

  const { data: accountsRes, isLoading: isLoadingAccounts } = useAccountControllerGet(
    { filter: `customer|eq|${selectedCustomer?.id} type|eq|sub`, limit: 50 } as any,
    { query: { enabled: !!selectedCustomer && needsFundingSource } },
  )
  const accounts: any[] = (accountsRes?.data as any)?.data || []

  const canSubmit = !!selectedCustomer && (!needsFundingSource || !!selectedAccount)

  const handleSubmit = () => {
    if (!selectedCustomer) return
    setAssigning(true)
    onAssign(selectedCustomer.id, selectedAccount || undefined)
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Assign this card</ModalDialogTitle>
          <ModalDialogDescription>Link this card to a customer account.</ModalDialogDescription>
        </ModalDialogHeader>

        <ModalDialogBody className="space-y-5">
          <SelectInput
            label="Customer"
            placeholder="Select a customer"
            options={customers.map((c: any) => ({
              value: c.id,
              label: c.name,
              description: c.email,
            }))}
            value={selectedCustomer?.id ?? ''}
            onChange={(val) => {
              const c = customers.find((c: any) => c.id === val)
              setSelectedCustomer(c ? { id: c.id, name: c.name } : null)
              setSelectedAccount('')
            }}
            searchable
            searchValue={search}
            onSearchChange={setSearch}
            loading={isLoadingCustomers}
            emptyMessage="No customers found"
            clearable
          />

          {needsFundingSource && selectedCustomer && (
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">Account</label>
              {isLoadingAccounts ? (
                <div className="p-4 text-center text-sm text-content-tertiary rounded-xl border border-border-primary-light">Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div className="rounded-xl bg-surface-secondary/60 border border-border-primary-light p-4 space-y-2">
                  <p className="text-sm font-semibold text-content-primary">No accounts found</p>
                  <p className="text-xs text-content-tertiary">This customer doesn&apos;t have a sub-account yet. Create one before assigning this card.</p>
                  <Link
                    href="/dashboard/accounts/new"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold link"
                    onClick={onClose}
                  >
                    Create an account <ChevronRight width={12} height={12} />
                  </Link>
                </div>
              ) : (
                <SelectInput
                  placeholder="Select an account"
                  options={accounts.map((a: any) => ({
                    value: a.id,
                    label: a.name || a.label || a.id,
                  }))}
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                  loading={isLoadingAccounts}
                />
              )}
            </div>
          )}
        </ModalDialogBody>

        <ModalDialogFooter>
          <ModalDialogClose asChild>
            <Button variant="outline" color="secondary" className="cursor-pointer">
              Cancel
            </Button>
          </ModalDialogClose>
          <Button
            color="primary"
            disabled={!canSubmit}
            loading={assigning}
            onClick={handleSubmit}
            className="cursor-pointer"
          >
            Assign this card
          </Button>
        </ModalDialogFooter>
      </ModalDialogContent>
    </ModalDialog>
  )
}
