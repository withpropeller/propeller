'use client'

import { useState } from 'react'
import { Play, Zap, RefreshCw, ArrowLeftRight } from 'lucide-react'
import {
  Button,
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
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
import {
  useCardsControllerSimulateCheck,
  useCardsControllerSendCaptureEvents,
  useCardsControllerSendReverseCapture,
} from '@/apiu/simulation-cards/simulation-cards'
import { SectionHeader } from '@/components/ui/DetailPage'

/* ── Channel selector shared by all sims ─────────────────── */

const SIM_CHANNELS = [
  { label: 'ATM', value: 'atm' },
  { label: 'POS', value: 'pos' },
  { label: 'Online', value: 'online' },
  { label: 'In-App', value: 'in-app' },
] as const

function SimChannelField({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  error?: string
}) {
  return (
    <Field>
      <FieldLabel>
        Channel <span className="text-feedback-danger-main">*</span>
      </FieldLabel>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select channel…" />
        </SelectTrigger>
        <SelectContent>
          {SIM_CHANNELS.map((ch) => (
            <SelectItem key={ch.value} value={ch.value}>
              {ch.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError errors={[{ message: error }]} />}
      {disabled && (
        <FieldDescription>Virtual cards are fixed to the online channel.</FieldDescription>
      )}
    </Field>
  )
}

/* ── Check Authorization Modal ───────────────────────────── */

function CheckAuthorizationModal({
  cardId,
  cardType,
  onClose,
}: {
  cardId: string
  cardType: string
  onClose: () => void
}) {
  const [channel, setChannel] = useState<string>(() => (cardType === 'virtual' ? 'online' : ''))
  const [errors, setErrors] = useState<{ channel?: string }>({})
  const { mutate: simulate, isPending } = useCardsControllerSimulateCheck()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: { channel?: string } = {}
    if (!channel) errs.channel = 'Please select a channel.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    simulate(
      { id: cardId, data: { channel: channel as any } },
      {
        onSuccess: () => {
          toast({ title: 'Check authorization simulated', severity: 'success' })
          onClose()
        },
        onError: (err: any) =>
          toast({ title: 'Simulation failed', description: err?.message, severity: 'danger' }),
      },
    )
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Check authorization</ModalDialogTitle>
          <ModalDialogDescription>
            Simulate a balance and cardholder name check request sent to your webhooks.
          </ModalDialogDescription>
        </ModalDialogHeader>
        <form onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-5">
            <SimChannelField
              value={channel}
              onChange={setChannel}
              disabled={cardType === 'virtual'}
              error={errors.channel}
            />
          </ModalDialogBody>
          <ModalDialogFooter>
            <ModalDialogClose asChild>
              <Button type="button" variant="outline" color="secondary" className="cursor-pointer">Cancel</Button>
            </ModalDialogClose>
            <Button type="submit" color="primary" loading={isPending} className="cursor-pointer">
              Simulate
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}

/* ── Capture Authorization Modal ─────────────────────────── */

function CaptureAuthorizationModal({
  cardId,
  cardType,
  onClose,
}: {
  cardId: string
  cardType: string
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [fees, setFees] = useState('')
  const [channel, setChannel] = useState<string>(() => (cardType === 'virtual' ? 'online' : ''))
  const [errors, setErrors] = useState<{ amount?: string; fees?: string; channel?: string }>({})
  const { mutate: simulate, isPending } = useCardsControllerSendCaptureEvents()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = 'Enter a valid amount greater than 0.'
    if (fees === '' || isNaN(Number(fees)) || Number(fees) < 0)
      errs.fees = 'Enter valid fees (0 or more).'
    if (!channel) errs.channel = 'Please select a channel.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    simulate(
      {
        id: cardId,
        data: {
          amount: Math.round(Number(amount) * 100),
          fees: Math.round(Number(fees) * 100),
          channel: channel as any,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Capture authorization simulated', severity: 'success' })
          onClose()
        },
        onError: (err: any) =>
          toast({ title: 'Simulation failed', description: err?.message, severity: 'danger' }),
      },
    )
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Capture authorization</ModalDialogTitle>
          <ModalDialogDescription>
            Create a capture request against this card to simulate a transaction ready for settlement.
          </ModalDialogDescription>
        </ModalDialogHeader>
        <form onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-5">
            <Field>
              <FieldLabel>Amount <span className="text-feedback-danger-main">*</span></FieldLabel>
              <TextInput type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount((e.target as HTMLInputElement).value)} placeholder="Enter capture amount" className="w-full" />
              {errors.amount && <FieldError errors={[{ message: errors.amount }]} />}
            </Field>
            <Field>
              <FieldLabel>Fees <span className="text-feedback-danger-main">*</span></FieldLabel>
              <TextInput type="number" min="0" step="0.01" value={fees} onChange={(e) => setFees((e.target as HTMLInputElement).value)} placeholder="Enter fees" className="w-full" />
              {errors.fees && <FieldError errors={[{ message: errors.fees }]} />}
            </Field>
            <SimChannelField value={channel} onChange={setChannel} disabled={cardType === 'virtual'} error={errors.channel} />
          </ModalDialogBody>
          <ModalDialogFooter>
            <ModalDialogClose asChild>
              <Button type="button" variant="outline" color="secondary" className="cursor-pointer">Cancel</Button>
            </ModalDialogClose>
            <Button type="submit" color="primary" loading={isPending} className="cursor-pointer">Simulate</Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}

/* ── Capture Update Authorization Modal ──────────────────── */

function CaptureUpdateModal({
  cardId,
  cardType,
  onClose,
}: {
  cardId: string
  cardType: string
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [updatedAmount, setUpdatedAmount] = useState('')
  const [fees, setFees] = useState('')
  const [updatedFees, setUpdatedFees] = useState('')
  const [channel, setChannel] = useState<string>(() => (cardType === 'virtual' ? 'online' : ''))
  const [errors, setErrors] = useState<{
    amount?: string; updatedAmount?: string; fees?: string; updatedFees?: string; channel?: string
  }>({})
  const { mutate: simulate, isPending } = useCardsControllerSendReverseCapture()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = 'Enter a valid amount greater than 0.'
    if (!updatedAmount || isNaN(Number(updatedAmount)) || Number(updatedAmount) <= 0)
      errs.updatedAmount = 'Enter a valid updated amount.'
    if (fees === '' || isNaN(Number(fees)) || Number(fees) < 0)
      errs.fees = 'Enter valid fees (0 or more).'
    if (updatedFees === '' || isNaN(Number(updatedFees)) || Number(updatedFees) < 0)
      errs.updatedFees = 'Enter valid updated fees (0 or more).'
    if (!channel) errs.channel = 'Please select a channel.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    simulate(
      {
        id: cardId,
        data: {
          amount: Math.round(Number(amount) * 100),
          fees: Math.round(Number(fees) * 100),
          channel: channel as any,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Capture update simulated', severity: 'success' })
          onClose()
        },
        onError: (err: any) =>
          toast({ title: 'Simulation failed', description: err?.message, severity: 'danger' }),
      },
    )
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="md" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Capture update</ModalDialogTitle>
          <ModalDialogDescription>
            Simulate a price update on an existing capture with new amounts and fees.
          </ModalDialogDescription>
        </ModalDialogHeader>
        <form onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Amount <span className="text-feedback-danger-main">*</span></FieldLabel>
                <TextInput type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount((e.target as HTMLInputElement).value)} placeholder="Original amount" className="w-full" />
                {errors.amount && <FieldError errors={[{ message: errors.amount }]} />}
              </Field>
              <Field>
                <FieldLabel>Updated Amount <span className="text-feedback-danger-main">*</span></FieldLabel>
                <TextInput type="number" min="0.01" step="0.01" value={updatedAmount} onChange={(e) => setUpdatedAmount((e.target as HTMLInputElement).value)} placeholder="Updated amount" className="w-full" />
                {errors.updatedAmount && <FieldError errors={[{ message: errors.updatedAmount }]} />}
              </Field>
              <Field>
                <FieldLabel>Fees <span className="text-feedback-danger-main">*</span></FieldLabel>
                <TextInput type="number" min="0" step="0.01" value={fees} onChange={(e) => setFees((e.target as HTMLInputElement).value)} placeholder="Original fees" className="w-full" />
                {errors.fees && <FieldError errors={[{ message: errors.fees }]} />}
              </Field>
              <Field>
                <FieldLabel>Updated Fees <span className="text-feedback-danger-main">*</span></FieldLabel>
                <TextInput type="number" min="0" step="0.01" value={updatedFees} onChange={(e) => setUpdatedFees((e.target as HTMLInputElement).value)} placeholder="Updated fees" className="w-full" />
                {errors.updatedFees && <FieldError errors={[{ message: errors.updatedFees }]} />}
              </Field>
            </div>
            <SimChannelField value={channel} onChange={setChannel} disabled={cardType === 'virtual'} error={errors.channel} />
          </ModalDialogBody>
          <ModalDialogFooter>
            <ModalDialogClose asChild>
              <Button type="button" variant="outline" color="secondary" className="cursor-pointer">Cancel</Button>
            </ModalDialogClose>
            <Button type="submit" color="primary" loading={isPending} className="cursor-pointer">Simulate</Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}

/* ── Capture Reversal Modal ──────────────────────────────── */

function CaptureReversalModal({
  cardId,
  cardType,
  onClose,
}: {
  cardId: string
  cardType: string
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [fees, setFees] = useState('')
  const [channel, setChannel] = useState<string>(() => (cardType === 'virtual' ? 'online' : ''))
  const [errors, setErrors] = useState<{ amount?: string; fees?: string; channel?: string }>({})
  const { mutate: simulate, isPending } = useCardsControllerSendReverseCapture()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = 'Enter a valid amount greater than 0.'
    if (fees === '' || isNaN(Number(fees)) || Number(fees) < 0)
      errs.fees = 'Enter valid fees (0 or more).'
    if (!channel) errs.channel = 'Please select a channel.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    simulate(
      {
        id: cardId,
        data: {
          amount: Math.round(Number(amount) * 100),
          fees: Math.round(Number(fees) * 100),
          channel: channel as any,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Capture reversal simulated', severity: 'success' })
          onClose()
        },
        onError: (err: any) =>
          toast({ title: 'Simulation failed', description: err?.message, severity: 'danger' }),
      },
    )
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Capture reversal</ModalDialogTitle>
          <ModalDialogDescription>
            Simulate reversal of a failed transaction back into this card&apos;s balance.
          </ModalDialogDescription>
        </ModalDialogHeader>
        <form onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-5">
            <Field>
              <FieldLabel>Amount <span className="text-feedback-danger-main">*</span></FieldLabel>
              <TextInput type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount((e.target as HTMLInputElement).value)} placeholder="Enter amount" className="w-full" />
              {errors.amount && <FieldError errors={[{ message: errors.amount }]} />}
            </Field>
            <Field>
              <FieldLabel>Fees <span className="text-feedback-danger-main">*</span></FieldLabel>
              <TextInput type="number" min="0" step="0.01" value={fees} onChange={(e) => setFees((e.target as HTMLInputElement).value)} placeholder="Enter fees" className="w-full" />
              {errors.fees && <FieldError errors={[{ message: errors.fees }]} />}
            </Field>
            <SimChannelField value={channel} onChange={setChannel} disabled={cardType === 'virtual'} error={errors.channel} />
          </ModalDialogBody>
          <ModalDialogFooter>
            <ModalDialogClose asChild>
              <Button type="button" variant="outline" color="secondary" className="cursor-pointer">Cancel</Button>
            </ModalDialogClose>
            <Button type="submit" color="primary" loading={isPending} className="cursor-pointer">Simulate</Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}

/* ── Simulation list items ───────────────────────────────── */

const SIMULATIONS = [
  {
    id: 'check',
    title: 'Check authorization',
    description: 'Simulate a balance and cardholder name check request sent to your webhooks.',
    icon: Play,
  },
  {
    id: 'capture',
    title: 'Capture authorization',
    description: 'Simulate a transaction capture request ready for settlement.',
    icon: Zap,
  },
  {
    id: 'capture-update',
    title: 'Capture update',
    description: 'Simulate a price update on an existing capture with new amounts and fees.',
    icon: ArrowLeftRight,
  },
  {
    id: 'capture-reversal',
    title: 'Capture reversal',
    description: 'Simulate reversal of a failed transaction back into the card balance.',
    icon: RefreshCw,
  },
] as const

/* ── Main export: Simulations Tab Content ────────────────── */

export function CardSimulationsTab({ cardId, cardType, hasCustomer }: {
  cardId: string
  cardType: string
  hasCustomer: boolean
}) {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  if (!hasCustomer) {
    return (
      <div className="py-10 flex flex-col items-center justify-center border border-dashed border-border-primary-light rounded-xl bg-surface-secondary/30 text-center">
        <div className="w-10 h-10 bg-surface-primary rounded-full flex items-center justify-center border border-border-primary-light mb-3">
          <Play width={18} height={18} className="text-content-quaternary" />
        </div>
        <p className="text-sm font-semibold text-content-primary">Assign a customer first</p>
        <p className="text-xs text-content-tertiary max-w-52 mt-1 leading-relaxed">
          Simulations exercise the card&apos;s authorization flow and are only available once a customer has been assigned.
        </p>
      </div>
    )
  }

  return (
    <>
      <div>
        <SectionHeader title="Card simulations" />
        <p className="text-sm text-content-tertiary mb-5">
          Replicate and test real-life card scenarios before going live.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SIMULATIONS.map((sim) => {
            const Icon = sim.icon
            return (
              <div
                key={sim.id}
                className="border border-border-primary-light rounded-xl bg-surface-primary p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center shrink-0">
                  <Icon width={18} height={18} className="text-content-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-content-primary">{sim.title}</p>
                  <p className="text-xs text-content-tertiary mt-0.5 mb-3 leading-relaxed">{sim.description}</p>
                  <Button
                    variant="outline"
                    color="secondary"
                    size="sm"
                    onClick={() => setActiveModal(sim.id)}
                  >
                    Start simulation
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {activeModal === 'check' && (
        <CheckAuthorizationModal cardId={cardId} cardType={cardType} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'capture' && (
        <CaptureAuthorizationModal cardId={cardId} cardType={cardType} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'capture-update' && (
        <CaptureUpdateModal cardId={cardId} cardType={cardType} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'capture-reversal' && (
        <CaptureReversalModal cardId={cardId} cardType={cardType} onClose={() => setActiveModal(null)} />
      )}
    </>
  )
}
