'use client'

import { Info } from 'lucide-react'
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
import { CopyButton } from '@/components/ui/CopyButton'
import { formatAmount } from '@/lib/format'

// Placeholder bank details. When the backend surfaces a per-invoice virtual
// account, swap these for the API response fields.
const BILLING_ACCOUNT = {
  bankName: 'Wema Bank',
  accountName: 'PAYSTACK PAYMENTS LTD',
  accountNumber: '0123456789',
}

interface PayInvoiceModalProps {
  invoiceNo: string
  amount: number
  currency: string
  onClose: () => void
}

export function PayInvoiceModal({ invoiceNo, amount, currency, onClose }: PayInvoiceModalProps) {
  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Pay via transfer</ModalDialogTitle>
          <ModalDialogDescription>
            Send the exact amount to the account below to settle this invoice.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <ModalDialogBody className="space-y-5">
          {/* Amount due — hero */}
          <div className="rounded-xl border border-border-primary-light bg-surface-secondary px-5 py-4">
            <div className="text-xs font-medium text-content-tertiary">Amount due</div>
            <div className="mt-1.5 text-3xl font-semibold text-content-primary tabular-nums leading-none">
              {formatAmount(amount, currency)}
            </div>
          </div>

          {/* Account details */}
          <div className="rounded-xl border border-border-primary-light divide-y divide-border-primary-light">
            <Row label="Bank">
              <span className="text-sm font-medium text-content-primary">{BILLING_ACCOUNT.bankName}</span>
            </Row>
            <Row label="Account name">
              <span className="text-sm font-medium text-content-primary">{BILLING_ACCOUNT.accountName}</span>
            </Row>
            <Row label="Account number">
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-mono font-semibold text-content-primary tracking-wider">
                  {BILLING_ACCOUNT.accountNumber}
                </span>
                <CopyButton text={BILLING_ACCOUNT.accountNumber} />
              </span>
            </Row>
            <Row label="Reference">
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-mono text-content-primary">{invoiceNo}</span>
                <CopyButton text={invoiceNo} />
              </span>
            </Row>
          </div>

          {/* Info callout */}
          <div className="flex items-start gap-2 rounded-lg bg-surface-secondary border border-border-primary-light px-3 py-2.5">
            <Info width={14} height={14} className="text-content-tertiary shrink-0 mt-0.5" />
            <p className="text-xs text-content-secondary leading-relaxed">
              Include the reference on your transfer so we can match the payment.
              Transfers usually reflect within 10 minutes.
            </p>
          </div>
        </ModalDialogBody>

        <ModalDialogFooter className="pt-6">
          <ModalDialogClose asChild>
            <Button color="primary" type="button" onClick={onClose} className="cursor-pointer">
              Done
            </Button>
          </ModalDialogClose>
        </ModalDialogFooter>
      </ModalDialogContent>
    </ModalDialog>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs font-medium text-content-tertiary">{label}</span>
      {children}
    </div>
  )
}
