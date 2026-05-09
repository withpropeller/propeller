'use client'

import { ReactNode, useState } from 'react'
import {
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
  RadioGroup,
  RadioGroupItem,
  FileUpload,
  Skeleton,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/lib/pax'
import { Pencil, Info, Link2, Upload, X } from 'lucide-react'
import { SelectInput } from '@/components/ui/SelectInput'
import { PhoneInput } from '@/components/ui/PhoneInput'
import type { StepConfig } from '@/components/ui/MultiStepFormShell'
import type { FormState, FieldErrors } from '../create/schema'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'

// ─── Constants ──────────────────────────────────────────────────────────────────

export const ALL_STEPS: (StepConfig & { physicalOnly: boolean })[] = [
  { id: 1, label: 'Name & type', physicalOnly: false },
  { id: 2, label: 'Details', physicalOnly: false },
  { id: 3, label: 'Authorization', physicalOnly: false },
  { id: 4, label: 'Personalization', physicalOnly: true },
  { id: 5, label: 'Distribution', physicalOnly: true },
  { id: 6, label: 'Review', physicalOnly: false },
]

export function getSteps(type: string): StepConfig[] {
  return ALL_STEPS.filter((s) => !('physicalOnly' in s) || !(s as any).physicalOnly || type === 'physical')
}

export const COUNTRIES = [
  { value: 'NG', label: 'Nigeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'KE', label: 'Kenya' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
]

/**
 * State values use ISO 3166-2 format: "CountryCode-RegionCode"
 * e.g. "NG-LA" for Lagos, Nigeria — required by the backend validator.
 */
export const STATES_BY_COUNTRY: Record<
  string,
  { value: string; label: string }[]
> = {
  NG: [
    { value: 'NG-AB', label: 'Abia' },
    { value: 'NG-FC', label: 'Abuja (FCT)' },
    { value: 'NG-AD', label: 'Adamawa' },
    { value: 'NG-AK', label: 'Akwa Ibom' },
    { value: 'NG-AN', label: 'Anambra' },
    { value: 'NG-BA', label: 'Bauchi' },
    { value: 'NG-BY', label: 'Bayelsa' },
    { value: 'NG-BE', label: 'Benue' },
    { value: 'NG-BO', label: 'Borno' },
    { value: 'NG-CR', label: 'Cross River' },
    { value: 'NG-DE', label: 'Delta' },
    { value: 'NG-EB', label: 'Ebonyi' },
    { value: 'NG-ED', label: 'Edo' },
    { value: 'NG-EK', label: 'Ekiti' },
    { value: 'NG-EN', label: 'Enugu' },
    { value: 'NG-GO', label: 'Gombe' },
    { value: 'NG-IM', label: 'Imo' },
    { value: 'NG-JI', label: 'Jigawa' },
    { value: 'NG-KD', label: 'Kaduna' },
    { value: 'NG-KN', label: 'Kano' },
    { value: 'NG-KT', label: 'Katsina' },
    { value: 'NG-KE', label: 'Kebbi' },
    { value: 'NG-KO', label: 'Kogi' },
    { value: 'NG-KW', label: 'Kwara' },
    { value: 'NG-LA', label: 'Lagos' },
    { value: 'NG-NA', label: 'Nasarawa' },
    { value: 'NG-NI', label: 'Niger' },
    { value: 'NG-OG', label: 'Ogun' },
    { value: 'NG-ON', label: 'Ondo' },
    { value: 'NG-OS', label: 'Osun' },
    { value: 'NG-OY', label: 'Oyo' },
    { value: 'NG-PL', label: 'Plateau' },
    { value: 'NG-RI', label: 'Rivers' },
    { value: 'NG-SO', label: 'Sokoto' },
    { value: 'NG-TA', label: 'Taraba' },
    { value: 'NG-YO', label: 'Yobe' },
    { value: 'NG-ZA', label: 'Zamfara' },
  ],
  GH: [
    { value: 'GH-AH', label: 'Ashanti' },
    { value: 'GH-AA', label: 'Greater Accra' },
    { value: 'GH-WP', label: 'Western' },
    { value: 'GH-CP', label: 'Central' },
    { value: 'GH-EP', label: 'Eastern' },
    { value: 'GH-NP', label: 'Northern' },
    { value: 'GH-TV', label: 'Volta' },
  ],
  KE: [
    { value: 'KE-110', label: 'Nairobi' },
    { value: 'KE-001', label: 'Mombasa' },
    { value: 'KE-042', label: 'Kisumu' },
    { value: 'KE-032', label: 'Nakuru' },
  ],
  ZA: [
    { value: 'ZA-GP', label: 'Gauteng' },
    { value: 'ZA-WC', label: 'Western Cape' },
    { value: 'ZA-KZN', label: 'KwaZulu-Natal' },
    { value: 'ZA-EC', label: 'Eastern Cape' },
  ],
  US: [
    { value: 'US-CA', label: 'California' },
    { value: 'US-NY', label: 'New York' },
    { value: 'US-TX', label: 'Texas' },
    { value: 'US-FL', label: 'Florida' },
    { value: 'US-IL', label: 'Illinois' },
  ],
  GB: [
    { value: 'GB-ENG', label: 'England' },
    { value: 'GB-SCT', label: 'Scotland' },
    { value: 'GB-WLS', label: 'Wales' },
    { value: 'GB-NIR', label: 'Northern Ireland' },
  ],
}

// ─── Shared Primitives ──────────────────────────────────────────────────────────

export function RequiredMark() {
  return <span className="text-feedback-danger-main ml-0.5">*</span>
}

export function OptionCard({
  value,
  current,
  onChange,
  label,
  description,
  disabled,
}: {
  value: string
  current: string
  onChange: (v: string) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  const isSelected = current === value
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(value)}
      disabled={disabled}
      className={`flex-1 text-left rounded-xl border px-4 py-3 transition-colors ${
        isSelected
          ? 'border-action-primary-main bg-surface-primary'
          : 'border-border-primary-light bg-surface-primary hover:border-border-primary-dark'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
            isSelected
              ? 'border-action-primary-main bg-action-primary-main'
              : 'border-border-primary-dark bg-transparent'
          }`}
        >
          {isSelected && (
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${isSelected ? 'text-content-primary' : 'text-content-secondary'}`}
          >
            {label}
          </p>
          {description && (
            <p className="text-xs text-content-tertiary mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

export function OptionCardGroup({
  label,
  required,
  options,
  value,
  onChange,
  error,
}: {
  label: string
  required?: boolean
  options: { value: string; label: string; description?: string }[]
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <Field>
      <FieldLabel>
        {label}
        {required && <RequiredMark />}
      </FieldLabel>
      <div className="flex gap-3">
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            {...opt}
            current={value}
            onChange={onChange}
          />
        ))}
      </div>
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  )
}

export function SectionHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="pt-4 border-t border-border-primary-light">
      <p className="text-sm font-semibold text-content-primary">{title}</p>
      {description && (
        <p className="text-xs text-content-tertiary mt-0.5">
          {description}
        </p>
      )}
    </div>
  )
}

/**
 * Horizontal inline radio group — matches PAX Radio Group (horizontal direction).
 * Best for binary or 2-3 short-label choices. Uses PAX RadioGroup + RadioGroupItem.
 */
export function InlineRadioGroup({
  label,
  required,
  description,
  options,
  value,
  onChange,
  error,
}: {
  label: string
  required?: boolean
  description?: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <Field>
      <FieldLabel>
        {label}
        {required && <RequiredMark />}
      </FieldLabel>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex flex-wrap gap-x-4 gap-y-2"
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} id={`radio-${opt.value}`} />
            <label
              htmlFor={`radio-${opt.value}`}
              className="text-sm text-content-primary cursor-pointer"
            >
              {opt.label}
            </label>
          </div>
        ))}
      </RadioGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  )
}

// ─── Review helpers ─────────────────────────────────────────────────────────────

export function ReviewSection({
  title,
  stepId,
  onEdit,
  children,
}: {
  title: string
  stepId: number
  onEdit: (stepId: number) => void
  children: ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-content-primary">
          {title}
        </p>
        <button
          type="button"
          onClick={() => onEdit(stepId)}
          className="flex items-center gap-1 text-xs font-semibold text-action-primary-main hover:text-action-primary-dark transition-colors cursor-pointer"
        >
          <Pencil width={12} height={12} />
          Edit
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function ReviewRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-content-tertiary shrink-0">
        {label}
      </span>
      <span className="text-sm text-content-primary text-right truncate">
        {value || '\u2014'}
      </span>
    </div>
  )
}

// ─── Step 1: Type & Name ────────────────────────────────────────────────────────

export function Step1TypeAndName({
  form,
  set,
  errors,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
}) {
  return (
    <div className="space-y-5">
      <Field>
        <FieldLabel>
          Program name <RequiredMark />
        </FieldLabel>
        <TextInput
          placeholder="e.g. Consumer Debit Program"
          value={form.name}
          onChange={(e) =>
            set('name', (e.target as HTMLInputElement).value)
          }
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <FieldError errors={[{ message: errors.name }]} />
        )}
        <FieldDescription>
          A recognizable name for this card program (max 50 characters).
        </FieldDescription>
      </Field>

      <OptionCardGroup
        label="Card type"
        required
        value={form.type}
        onChange={(v) => set('type', v)}
        error={errors.type}
        options={[
          {
            value: 'physical',
            label: 'Physical card',
            description:
              'Embossed card shipped to a delivery address.',
          },
          {
            value: 'virtual',
            label: 'Virtual card',
            description:
              'Digital card issued instantly for online payments.',
          },
        ]}
      />
    </div>
  )
}

// ─── Step 2: Program Details ────────────────────────────────────────────────────

export function Step2Details({
  form,
  set,
  errors,
  bins,
  binsLoading,
  isSandboxMode = false,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
  bins: any[]
  binsLoading: boolean
  isSandboxMode?: boolean
}) {
  const dedicatedBinOptions = bins.map((b: any) => ({
    value: b.id,
    label: `${b.name} \u2014 ${b.id}`,
  }))

  return (
    <div className="space-y-5">
      <Field>
        <FieldLabel>
          Card network <RequiredMark />
        </FieldLabel>
        <Select
          value={form.network}
          onValueChange={(v) => set('network', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mastercard">Mastercard</SelectItem>
            <SelectItem value="verve">Verve</SelectItem>
          </SelectContent>
        </Select>
        {errors.network && (
          <FieldError errors={[{ message: errors.network }]} />
        )}
      </Field>

      <InlineRadioGroup
        label="Currency"
        required
        value={form.currency}
        onChange={(v) => set('currency', v)}
        error={errors.currency}
        options={[
          { value: 'NGN', label: 'Nigerian Naira (NGN)' },
        ]}
      />

      {form.type === 'physical' && (
        <>
          <OptionCardGroup
            label="BIN type"
            required
            value={form.binType}
            onChange={(v) => set('binType', v)}
            error={errors.binType}
            options={[
              {
                value: 'shared',
                label: 'Shared',
                description:
                  'Use a shared BIN managed by Allawee.',
              },
              {
                value: 'dedicated',
                label: 'Dedicated',
                description:
                  'Assign a BIN you have already created.',
              },
            ]}
          />

          {form.binType === 'dedicated' &&
            (binsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : dedicatedBinOptions.length > 0 ? (
              <Field>
                <FieldLabel>
                  Select BIN <RequiredMark />
                </FieldLabel>
                <Select
                  value={form.bin}
                  onValueChange={(v) => set('bin', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a card BIN" />
                  </SelectTrigger>
                  <SelectContent>
                    {dedicatedBinOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bin && (
                  <FieldError errors={[{ message: errors.bin }]} />
                )}
              </Field>
            ) : (
              <div className="rounded-xl border border-border-primary-light bg-surface-secondary px-4 py-4 text-sm text-content-tertiary">
                No card BINs found. Create one under{' '}
                <span className="font-medium text-content-primary">
                  Issuing &rarr; BINs
                </span>{' '}
                first.
              </div>
            ))}

          <Field>
            <FieldLabel>
              Estimated card quantity <RequiredMark />
            </FieldLabel>
            <TextInput
              placeholder={isSandboxMode ? 'Maximum 5' : 'Minimum 2,000'}
              value={form.quantity}
              onChange={(e) =>
                set(
                  'quantity',
                  (e.target as HTMLInputElement).value.replace(
                    /\D/g,
                    '',
                  ),
                )
              }
              type="number"
              aria-invalid={!!errors.quantity}
            />
            {errors.quantity && (
              <FieldError errors={[{ message: errors.quantity }]} />
            )}
            <FieldDescription>
              An estimate of cards to be created under this program.
            </FieldDescription>
          </Field>
        </>
      )}
    </div>
  )
}

// ─── Step 3: Authorization ──────────────────────────────────────────────────────

export function Step3Authorization({
  form,
  set,
  errors,
  accounts,
  accountsLoading,
  webhooks,
  webhooksLoading,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
  accounts: any[]
  accountsLoading: boolean
  webhooks: any[]
  webhooksLoading: boolean
}) {
  const accountOptions = accounts.map((a: any) => ({
    value: a.id,
    label: `${a.name || a.id} \u2014 ${a.currency}`,
  }))
  const webhookOptions = webhooks.map((w: any) => ({
    value: w.id,
    label: w.url,
  }))

  const timeoutDescription =
    form.timeoutDefault === 'approve'
      ? 'Transactions will be automatically approved if the authorization webhook does not respond within 3 seconds.'
      : 'Transactions will be automatically declined if the authorization webhook does not respond within 3 seconds.'

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <OptionCardGroup
          label="Funding source"
          required
          value={form.fundingSourceType}
          onChange={(v) => set('fundingSourceType', v)}
          error={errors.fundingSourceType}
          options={[
            {
              value: 'pool-account',
              label: 'Pool account',
              description:
                'Cards draw from a shared funding account.',
            },
            {
              value: 'card-account',
              label: 'Per-card balance',
              description: 'Each card is funded individually.',
            },
          ]}
        />

        {form.fundingSourceType === 'pool-account' && (
          <Field>
            <FieldLabel>
              Pool account <RequiredMark />
            </FieldLabel>
            <Select
              value={form.poolAccount}
              onValueChange={(v) => set('poolAccount', v)}
              disabled={accountsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    accountsLoading
                      ? 'Loading\u2026'
                      : 'Select a pool account'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.poolAccount && (
              <FieldError errors={[{ message: errors.poolAccount }]} />
            )}
          </Field>
        )}

        <Field>
          <div className="flex items-center gap-1">
            <FieldLabel>
              Early refund account <RequiredMark />
            </FieldLabel>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="text-content-tertiary hover:text-content-secondary transition-colors"
              >
                <Info size={13} />
              </TooltipTrigger>
              <TooltipContent>
                The account where funds are returned when a cardholder
                disputes a transaction and is granted an early refund
                before the dispute is fully resolved.
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={form.settlementAccount}
            onValueChange={(v) => set('settlementAccount', v)}
            disabled={accountsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  accountsLoading
                    ? 'Loading\u2026'
                    : 'Select an account'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {accountOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.settlementAccount && (
            <FieldError
              errors={[{ message: errors.settlementAccount }]}
            />
          )}
        </Field>

        {form.fundingSourceType === 'pool-account' && (
          <Field>
            <FieldLabel>Webhook</FieldLabel>
            {webhooksLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : webhookOptions.length > 0 ? (
              <Select
                value={form.webhook}
                onValueChange={(v) => set('webhook', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a webhook endpoint" />
                </SelectTrigger>
                <SelectContent>
                  {webhookOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-xl border border-border-primary-light bg-surface-secondary px-4 py-3 text-sm text-content-tertiary">
                No webhooks found.
              </div>
            )}
            <FieldDescription>
              Receives authorization requests for real-time approval.{' '}
              <a
                href="/dashboard/developer/webhooks"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-action-primary-main hover:text-action-primary-dark"
              >
                Create a webhook
              </a>
            </FieldDescription>
          </Field>
        )}

        <InlineRadioGroup
          label="Timeout action"
          value={form.timeoutDefault}
          onChange={(v) => set('timeoutDefault', v)}
          description={timeoutDescription}
          options={[
            { value: 'approve', label: 'Approve' },
            { value: 'decline', label: 'Decline' },
          ]}
        />
      </div>
    </TooltipProvider>
  )
}

// ─── Step 4: Personalization ────────────────────────────────────────────────────

export function Step4Personalization({
  form,
  set,
  errors,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
}) {
  const [showLinkInput, setShowLinkInput] = useState(!!form.frontArtworkFile)

  async function handleFileUpload(
    { file }: { file: File; id: string },
    callback: (params: {
      progress: number
      error?: string
      path?: string
      status:
        | 'upload_idle'
        | 'upload_ongoing'
        | 'upload_success'
        | 'upload_failed'
        | 'file_invalid'
        | 'file_valid'
    }) => void,
  ) {
    callback({ progress: 0, status: 'upload_ongoing' })
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null
      const mode = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) ?? 'sandbox') : 'sandbox'
      const res = await fetch(`${API_BASE_URL}/tools/temp-file/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-dashboard-mode': mode,
        },
      })
      if (!res.ok) throw new Error('Upload failed')
      const json = await res.json()
      const url: string = json?.data?.url ?? ''
      set('frontArtworkFile', url)
      callback({ progress: 100, path: url, status: 'upload_success' })
    } catch {
      callback({ progress: 0, status: 'upload_failed', error: 'Upload failed. Please try again.' })
    }
  }

  return (
    <div className="space-y-5">
      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel>Card artwork</FieldLabel>
          <a
            href="https://alw-cdn.s3.eu-west-1.amazonaws.com/templates/card_design_guidelines.pdf"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-action-primary-main hover:text-action-primary-dark"
          >
            Download guideline
          </a>
        </div>

        {showLinkInput ? (
          <>
            <TextInput
              placeholder="https://your-cdn.com/card-design.png"
              value={form.frontArtworkFile}
              onChange={(e) =>
                set('frontArtworkFile', (e.target as HTMLInputElement).value)
              }
            />
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(false)
                set('frontArtworkFile', '')
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-action-primary-main hover:text-action-primary-dark transition-colors cursor-pointer mt-1"
            >
              <Upload width={14} height={14} />
              Upload a file instead
            </button>
          </>
        ) : form.frontArtworkFile ? (
          <>
            <div className="flex items-center gap-3 h-16 p-0">
              <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-surface-secondary shadow-whisper">
                <img
                  src={form.frontArtworkFile}
                  alt="Card artwork"
                  className="h-16 w-16 object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm text-content-primary">
                  {form.frontArtworkFile.split('/').pop()}
                </div>
                <div className="text-xs text-content-tertiary mt-0.5">Uploaded</div>
              </div>
              <button
                type="button"
                onClick={() => set('frontArtworkFile', '')}
                className="p-1.5 text-content-secondary hover:text-content-primary transition-colors cursor-pointer shrink-0"
                aria-label="Remove artwork"
              >
                <X width={16} height={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowLinkInput(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-action-primary-main hover:text-action-primary-dark transition-colors cursor-pointer mt-1"
            >
              <Link2 width={14} height={14} />
              Share a link instead
            </button>
          </>
        ) : (
          <>
            <FileUpload
              onFileUpload={handleFileUpload}
              onFileRemove={() => set('frontArtworkFile', '')}
              acceptedFileTypes={[
                'image/svg+xml',
                'image/png',
                'image/jpeg',
                'image/gif',
              ]}
              maxFileSize={5 * 1024 * 1024}
              maxFiles={1}
              size="large"
              dropZoneLabel="Drag and drop files, or browse files"
              dropZoneDescription="SVG, PNG, JPG or GIF (max. 5MB)"
            />
            <button
              type="button"
              onClick={() => setShowLinkInput(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-action-primary-main hover:text-action-primary-dark transition-colors cursor-pointer mt-1"
            >
              <Link2 width={14} height={14} />
              Share a link instead
            </button>
          </>
        )}
      </Field>

      <SectionHeader
        title="Card display name"
        description="Name shown on card terminals during transactions"
      />

      <Field>
        <FieldLabel>
          Display name <RequiredMark />
        </FieldLabel>
        <TextInput
          placeholder="e.g. Dealings Enterprise"
          value={form.defaultCardholderName}
          onChange={(e) =>
            set(
              'defaultCardholderName',
              (e.target as HTMLInputElement).value,
            )
          }
          aria-invalid={!!errors.defaultCardholderName}
        />
        {errors.defaultCardholderName && (
          <FieldError
            errors={[{ message: errors.defaultCardholderName }]}
          />
        )}
        <FieldDescription>
          A preview of the name that shows when making a payment on ATM,
          POS, or online.
        </FieldDescription>
      </Field>
    </div>
  )
}

// ─── Step 5: Distribution ───────────────────────────────────────────────────────

export function Step5Distribution({
  form,
  set,
  errors,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
}) {
  const stateOptions = (STATES_BY_COUNTRY[form.country] ?? []).map((s) => ({
    value: s.value,
    label: s.label,
  }))

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Delivery details"
        description="Enter number and address to send all cards"
      />

      <Field>
        <FieldLabel>
          Phone number <RequiredMark />
        </FieldLabel>
        <PhoneInput
          value={form.phoneNumber}
          onChange={(v) => set('phoneNumber', v)}
          aria-invalid={!!errors.phoneNumber}
        />
        {errors.phoneNumber && (
          <FieldError errors={[{ message: errors.phoneNumber }]} />
        )}
      </Field>

      <Field>
        <FieldLabel>
          Address <RequiredMark />
        </FieldLabel>
        <div className="space-y-2">
          <TextInput
            placeholder="Address line 1"
            value={form.addressLine1}
            onChange={(e) =>
              set(
                'addressLine1',
                (e.target as HTMLInputElement).value,
              )
            }
            aria-invalid={!!errors.addressLine1}
          />
          <TextInput
            placeholder="Address line 2 (optional)"
            value={form.addressLine2}
            onChange={(e) =>
              set(
                'addressLine2',
                (e.target as HTMLInputElement).value,
              )
            }
          />
        </div>
        {errors.addressLine1 && (
          <FieldError errors={[{ message: errors.addressLine1 }]} />
        )}
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field>
          <FieldLabel>
            Country <RequiredMark />
          </FieldLabel>
          <SelectInput
            options={COUNTRIES}
            value={form.country}
            onChange={(v) => {
              set('country', v)
              set('state', '')
            }}
            placeholder="Select"
            searchable
            searchPlaceholder="Search countries..."
          />
          {errors.country && (
            <FieldError errors={[{ message: errors.country }]} />
          )}
        </Field>

        <Field>
          <FieldLabel>
            State <RequiredMark />
          </FieldLabel>
          <SelectInput
            options={stateOptions}
            value={form.state}
            onChange={(v) => set('state', v)}
            placeholder={
              form.country ? 'Select state' : 'Select country first'
            }
            disabled={!form.country}
            searchable
            searchPlaceholder="Search states..."
          />
          {errors.state && (
            <FieldError errors={[{ message: errors.state }]} />
          )}
        </Field>

        <Field>
          <FieldLabel>
            City <RequiredMark />
          </FieldLabel>
          <TextInput
            placeholder="Enter city"
            value={form.city}
            onChange={(e) =>
              set('city', (e.target as HTMLInputElement).value)
            }
            aria-invalid={!!errors.city}
          />
          {errors.city && (
            <FieldError errors={[{ message: errors.city }]} />
          )}
        </Field>
      </div>
    </div>
  )
}

// ─── Review Step ────────────────────────────────────────────────────────────────

export function StepReview({
  form,
  onEdit,
  accounts,
  webhooks,
}: {
  form: FormState
  onEdit: (stepId: number) => void
  accounts: any[]
  webhooks: any[]
}) {
  const accountName = (id: string) =>
    accounts.find((a: any) => a.id === id)?.name || id || '\u2014'
  const webhookUrl = (id: string) =>
    webhooks.find((w: any) => w.id === id)?.url || id || '\u2014'
  const countryLabel = (code: string) =>
    COUNTRIES.find((c) => c.value === code)?.label || code
  const stateLabel = (country: string, state: string) => {
    const states = STATES_BY_COUNTRY[country] ?? []
    return states.find((s) => s.value === state)?.label || state
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border-primary-light bg-surface-secondary/50 px-4 py-3">
        <p className="text-sm text-content-secondary">
          Review the details below before requesting approval. You can edit
          any section by clicking the edit button.
        </p>
      </div>

      <ReviewSection title="Name & type" stepId={1} onEdit={onEdit}>
        <ReviewRow
          label="Card type"
          value={
            form.type === 'physical' ? 'Physical card' : 'Virtual card'
          }
        />
        <ReviewRow label="Program name" value={form.name} />
      </ReviewSection>

      <div className="border-t border-border-primary-light" />

      <ReviewSection title="Program details" stepId={2} onEdit={onEdit}>
        <ReviewRow
          label="Network"
          value={
            form.network.charAt(0).toUpperCase() + form.network.slice(1)
          }
        />
        <ReviewRow label="Currency" value={form.currency} />
        {form.type === 'physical' && (
          <>
            <ReviewRow
              label="BIN type"
              value={
                form.binType === 'dedicated' ? 'Dedicated' : 'Shared'
              }
            />
            {form.binType === 'dedicated' && form.bin && (
              <ReviewRow label="BIN" value={form.bin} />
            )}
            <ReviewRow
              label="Quantity"
              value={
                form.quantity
                  ? Number(form.quantity).toLocaleString()
                  : '\u2014'
              }
            />
          </>
        )}
      </ReviewSection>

      <div className="border-t border-border-primary-light" />

      <ReviewSection title="Authorization" stepId={3} onEdit={onEdit}>
        <ReviewRow
          label="Funding source"
          value={
            form.fundingSourceType === 'pool-account'
              ? 'Pool account'
              : 'Per-card balance'
          }
        />
        {form.fundingSourceType === 'pool-account' && (
          <ReviewRow
            label="Pool account"
            value={accountName(form.poolAccount)}
          />
        )}
        <ReviewRow
          label="Early refund account"
          value={accountName(form.settlementAccount)}
        />
        {form.webhook && (
          <ReviewRow
            label="Webhook"
            value={webhookUrl(form.webhook)}
          />
        )}
        <ReviewRow
          label="Timeout action"
          value={
            form.timeoutDefault === 'approve'
              ? 'Auto-approve'
              : 'Auto-decline'
          }
        />
      </ReviewSection>

      {form.type === 'physical' && (
        <>
          <div className="border-t border-border-primary-light" />
          <ReviewSection
            title="Personalization"
            stepId={4}
            onEdit={onEdit}
          >
            <ReviewRow
              label="Card artwork"
              value={form.frontArtworkFile || 'Not provided'}
            />
            <ReviewRow
              label="Display name"
              value={form.defaultCardholderName}
            />
          </ReviewSection>

          <div className="border-t border-border-primary-light" />
          <ReviewSection
            title="Distribution"
            stepId={5}
            onEdit={onEdit}
          >
            <ReviewRow
              label="Delivery type"
              value={
                form.distributionType === 'bulked'
                  ? 'Bulk delivery'
                  : 'Direct to consumers'
              }
            />
            <ReviewRow label="Phone" value={form.phoneNumber} />
            <ReviewRow
              label="Address"
              value={[form.addressLine1, form.addressLine2]
                .filter(Boolean)
                .join(', ')}
            />
            <ReviewRow
              label="Location"
              value={[
                form.city,
                stateLabel(form.country, form.state),
                countryLabel(form.country),
              ]
                .filter(Boolean)
                .join(', ')}
            />
          </ReviewSection>
        </>
      )}
    </div>
  )
}
