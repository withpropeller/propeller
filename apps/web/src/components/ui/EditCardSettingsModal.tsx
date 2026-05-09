'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
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
  TextInput,
  Field,
  FieldLabel,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/lib/pax'
import { Switch } from '@/components/ui/Switch'
import { formatAmount } from '@/lib/format'

interface Channel {
  label: string
  value: string
  description: string
  selected: boolean
}

interface SpendingLimit {
  amount: number
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

interface MetaEntry {
  key: string
  value: string
}

const CHANNELS: Channel[] = [
  { label: 'ATM', value: 'atm', description: 'Usage of this card at bank ATMs', selected: false },
  { label: 'POS Terminals', value: 'pos', description: 'Usage of this card on POS terminals', selected: false },
  { label: 'Online Channels', value: 'online', description: 'Usage of this card on websites and other online channels', selected: false },
]

const INTERVALS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

interface EditCardSettingsModalProps {
  onClose: () => void
  onSave: (data: {
    controls: { allowedChannels: string[]; blockedChannels: string[]; spendingLimits: SpendingLimit[] }
    metadata: Record<string, string>
  }) => void
  loading: boolean
  initialChannels?: string[]
  initialLimits?: SpendingLimit[]
  initialMetadata?: Record<string, string>
  currency?: string
}

export function EditCardSettingsModal({
  onClose,
  onSave,
  loading,
  initialChannels = [],
  initialLimits = [],
  initialMetadata = {},
  currency,
}: EditCardSettingsModalProps) {
  // Channels
  const [channels, setChannels] = useState<Channel[]>(() =>
    CHANNELS.map((ch) => ({ ...ch, selected: initialChannels.includes(ch.value) }))
  )

  // Spending limits
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>(initialLimits)
  const [limitAmount, setLimitAmount] = useState('')
  const [limitInterval, setLimitInterval] = useState<SpendingLimit['interval']>('daily')

  // Metadata
  const [entries, setEntries] = useState<MetaEntry[]>(() =>
    Object.entries(initialMetadata).map(([key, value]) => ({ key, value: String(value) }))
  )
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const handleAddLimit = () => {
    if (!limitAmount) return
    const amount = Math.round(parseFloat(limitAmount) * 100)
    setSpendingLimits((prev) => {
      const idx = prev.findIndex((l) => l.interval === limitInterval)
      if (idx !== -1) {
        const copy = [...prev]
        copy[idx] = { amount, interval: limitInterval }
        return copy
      }
      return [...prev, { amount, interval: limitInterval }]
    })
    setLimitAmount('')
  }

  const handleAddMeta = () => {
    if (!newKey || !newValue) return
    setEntries((prev) => {
      const idx = prev.findIndex((m) => m.key === newKey)
      if (idx !== -1) {
        const copy = [...prev]
        copy[idx] = { key: newKey, value: newValue }
        return copy
      }
      return [...prev, { key: newKey, value: newValue }]
    })
    setNewKey('')
    setNewValue('')
  }

  const handleSave = () => {
    const allowedChannels = channels.filter((c) => c.selected).map((c) => c.value)
    const blockedChannels = channels.filter((c) => !c.selected).map((c) => c.value)
    const metaObj: Record<string, string> = {}
    entries.forEach(({ key, value }) => { metaObj[key] = value })
    onSave({
      controls: { allowedChannels, blockedChannels, spendingLimits },
      metadata: metaObj,
    })
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="md" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Edit card settings</ModalDialogTitle>
          <ModalDialogDescription>
            Manage card controls, spending limits, and metadata.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <ModalDialogBody className="space-y-8 max-h-[60vh] overflow-y-auto">
          {/* Channel controls */}
          <div>
            <p className="text-sm font-semibold text-content-primary mb-3">Allowed channels</p>
            <div className="space-y-4">
              {channels.map((ch, i) => (
                <div key={ch.value} className="flex items-start gap-3">
                  <Switch
                    checked={ch.selected}
                    onCheckedChange={() =>
                      setChannels((prev) =>
                        prev.map((c, idx) => (idx === i ? { ...c, selected: !c.selected } : c))
                      )
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-content-primary">{ch.label}</p>
                    <p className="text-xs text-content-tertiary">{ch.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spending limits */}
          <div>
            <p className="text-sm font-semibold text-content-primary mb-3">Spending limits</p>
            <p className="text-xs text-content-tertiary mb-4">
              Set caps per interval. The most restrictive applicable limit wins at authorization time.
            </p>
            {spendingLimits.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {spendingLimits.map((limit, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 border border-border-primary-light bg-surface-secondary rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {formatAmount(limit.amount, currency)}
                    <span className="text-content-tertiary capitalize">/ {limit.interval}</span>
                    <button
                      type="button"
                      onClick={() => setSpendingLimits((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-content-tertiary hover:text-feedback-danger-main ml-1"
                    >
                      <X width={12} height={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Amount</FieldLabel>
                <TextInput
                  type="number"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount((e.target as HTMLInputElement).value)}
                  placeholder="Enter limit amount"
                  className="w-full"
                />
              </Field>
              <Field>
                <FieldLabel>Frequency</FieldLabel>
                <Select value={limitInterval} onValueChange={(v) => setLimitInterval(v as SpendingLimit['interval'])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVALS.map((iv) => (
                      <SelectItem key={iv.value} value={iv.value}>
                        {iv.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Button variant="outline" size="sm" color="secondary" onClick={handleAddLimit} className="mt-3 gap-1">
              <Plus width={14} height={14} /> Add limit
            </Button>
          </div>

          {/* Metadata */}
          <div>
            <p className="text-sm font-semibold text-content-primary mb-3">Metadata</p>
            <p className="text-xs text-content-tertiary mb-4">
              Attach arbitrary key/value pairs to this card for tracking or filtering.
            </p>
            {entries.length > 0 && (
              <div className="space-y-2 mb-4">
                {entries.map((meta, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 border border-border-primary-light bg-surface-secondary rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-content-tertiary font-medium font-mono text-xs">{meta.key}</span>
                    <span className="text-content-quaternary">=</span>
                    <span className="text-content-primary font-mono text-xs flex-1 truncate">{meta.value}</span>
                    <button
                      type="button"
                      onClick={() => setEntries((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-content-tertiary hover:text-feedback-danger-main shrink-0"
                    >
                      <X width={14} height={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Key</FieldLabel>
                <TextInput
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey((e.target as HTMLInputElement).value)}
                  placeholder="Enter key"
                  className="w-full"
                />
              </Field>
              <Field>
                <FieldLabel>Value</FieldLabel>
                <TextInput
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue((e.target as HTMLInputElement).value)}
                  placeholder="Enter value"
                  className="w-full"
                />
              </Field>
            </div>
            <Button variant="outline" size="sm" color="secondary" onClick={handleAddMeta} className="mt-3 gap-1">
              <Plus width={14} height={14} /> Add entry
            </Button>
          </div>
        </ModalDialogBody>

        <ModalDialogFooter>
          <ModalDialogClose asChild>
            <Button variant="outline" color="secondary" className="cursor-pointer">Cancel</Button>
          </ModalDialogClose>
          <Button color="primary" loading={loading} onClick={handleSave} className="cursor-pointer">
            Save changes
          </Button>
        </ModalDialogFooter>
      </ModalDialogContent>
    </ModalDialog>
  )
}
