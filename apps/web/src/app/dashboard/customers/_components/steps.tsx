'use client'

import { useState, type ReactNode } from 'react'
import {
  Field,
  FieldLabel,
  FieldError,
  TextInput,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
  FileUpload,
} from '@/lib/pax'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { SelectInput } from '@/components/ui/SelectInput'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'
import type { StepConfig } from '@/components/ui/MultiStepFormShell'
import type { FormState, FieldErrors, DirectorFormState } from '../new/schema'
import {
  getTierFromVerificationType,
  validateDirector,
  INITIAL_DIRECTOR,
} from '../new/schema'

// ─── Step configs ────────────────────────────────────────────────────────────────

export const INDIVIDUAL_STEPS: StepConfig[] = [
  { id: 1, label: 'Customer type' },
  { id: 2, label: 'Personal information' },
  { id: 3, label: 'Address' },
  { id: 4, label: 'Identity & verification' },
  { id: 5, label: 'Metadata' },
  { id: 6, label: 'Review' },
]

export const BUSINESS_STEPS: StepConfig[] = [
  { id: 1, label: 'Customer type' },
  { id: 2, label: 'Business information' },
  { id: 3, label: 'Business address' },
  { id: 4, label: 'Business identity' },
  { id: 5, label: 'Directors' },
  { id: 6, label: 'Metadata' },
  { id: 7, label: 'Review' },
]

// ─── Constants ───────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
]

const TITLE_OPTIONS = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Prof', label: 'Prof' },
]

const ID_TYPE_OPTIONS = [
  { value: 'bvn', label: 'BVN' },
  { value: 'nin', label: 'NIN' },
  { value: 'drivers-license', label: "Driver's License" },
  { value: 'voters-card', label: "Voter's Card" },
  { value: 'passport', label: 'Passport' },
]

const VERIFICATION_TYPE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'tier-1', label: 'Tier 1' },
  { value: 'tier-2', label: 'Tier 2' },
  { value: 'tier-3', label: 'Tier 3' },
]

// ─── Shared Primitives ───────────────────────────────────────────────────────────

function RequiredMark() {
  return <span className="text-feedback-danger-main ml-0.5">*</span>
}

function ReviewSection({
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
        <p className="text-sm font-semibold text-content-primary">{title}</p>
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-content-tertiary shrink-0">{label}</span>
      <span className="text-sm text-content-primary text-right truncate">
        {value || '\u2014'}
      </span>
    </div>
  )
}

// ─── Upload helper ───────────────────────────────────────────────────────────────

type UploadCallback = (params: {
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
}) => void

async function uploadTempFile(
  file: File,
  onProgress: UploadCallback,
  onSuccess: (url: string) => void,
) {
  onProgress({ progress: 0, status: 'upload_ongoing' })
  try {
    const formData = new FormData()
    formData.append('file', file)
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        : null
    const mode =
      typeof window !== 'undefined'
        ? (localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) ?? 'sandbox')
        : 'sandbox'
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
    onSuccess(url)
    onProgress({ progress: 100, path: url, status: 'upload_success' })
  } catch {
    onProgress({
      progress: 0,
      status: 'upload_failed',
      error: 'Upload failed. Please try again.',
    })
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────────

interface CountryOption {
  value: string
  label: string
}

// ─── Step 1: Customer Type ───────────────────────────────────────────────────────

export function StepCustomerType({
  form,
  set,
  errors,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
}) {
  return (
    <div className="space-y-3">
      {(['individual', 'business'] as const).map((type) => {
        const isSelected = form.customerType === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => set('customerType', type)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
              isSelected
                ? 'border-action-primary-main bg-action-primary-subtle'
                : 'border-border-primary-light hover:border-border-primary-main'
            }`}
          >
            <p className="text-sm font-semibold text-content-primary capitalize">
              {type}
            </p>
            <p className="text-xs text-content-tertiary mt-0.5">
              {type === 'individual'
                ? 'A person with individual identity verification'
                : 'A company or organisation with corporate identity verification'}
            </p>
          </button>
        )
      })}
      {errors.customerType && (
        <FieldError errors={[{ message: errors.customerType }]} />
      )}
    </div>
  )
}

// ─── Step 2 (Individual): Personal Information ───────────────────────────────────

export function StepIndividualInfo({
  form,
  set,
  errors,
  countryOptions,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
  countryOptions: CountryOption[]
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Title</FieldLabel>
          <Select value={form.title} onValueChange={(v) => set('title', v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              {TITLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Gender</FieldLabel>
          <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>
            First name <RequiredMark />
          </FieldLabel>
          <TextInput
            value={form.firstName}
            onChange={(e) =>
              set('firstName', (e.target as HTMLInputElement).value)
            }
            placeholder="First name"
            aria-invalid={!!errors.firstName}
          />
          {errors.firstName && (
            <FieldError errors={[{ message: errors.firstName }]} />
          )}
        </Field>
        <Field>
          <FieldLabel>Middle name</FieldLabel>
          <TextInput
            value={form.middleName}
            onChange={(e) =>
              set('middleName', (e.target as HTMLInputElement).value)
            }
            placeholder="Middle name"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel>
          Last name <RequiredMark />
        </FieldLabel>
        <TextInput
          value={form.lastName}
          onChange={(e) =>
            set('lastName', (e.target as HTMLInputElement).value)
          }
          placeholder="Last name"
          aria-invalid={!!errors.lastName}
        />
        {errors.lastName && (
          <FieldError errors={[{ message: errors.lastName }]} />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>
            Email address <RequiredMark />
          </FieldLabel>
          <TextInput
            type="email"
            value={form.email}
            onChange={(e) =>
              set('email', (e.target as HTMLInputElement).value)
            }
            placeholder="Email address"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <FieldError errors={[{ message: errors.email }]} />
          )}
        </Field>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>
            Date of birth <RequiredMark />
          </FieldLabel>
          <TextInput
            type="date"
            value={form.dateOfBirth}
            onChange={(e) =>
              set('dateOfBirth', (e.target as HTMLInputElement).value)
            }
            aria-invalid={!!errors.dateOfBirth}
          />
          {errors.dateOfBirth && (
            <FieldError errors={[{ message: errors.dateOfBirth }]} />
          )}
        </Field>
        <Field>
          <FieldLabel>
            Nationality <RequiredMark />
          </FieldLabel>
          <SelectInput
            options={countryOptions}
            value={form.nationalityCode}
            onChange={(v) => set('nationalityCode', v)}
            placeholder="Select nationality"
            searchable
          />
          {errors.nationalityCode && (
            <FieldError errors={[{ message: errors.nationalityCode }]} />
          )}
        </Field>
      </div>

      <Field>
        <FieldLabel>Customer reference</FieldLabel>
        <TextInput
          value={form.reference}
          onChange={(e) =>
            set('reference', (e.target as HTMLInputElement).value)
          }
          placeholder="Internal reference (optional)"
        />
      </Field>
    </div>
  )
}

// ─── Step 2 (Business): Business Information ─────────────────────────────────────

export function StepBusinessInfo({
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
          Registration name <RequiredMark />
        </FieldLabel>
        <TextInput
          value={form.registrationName}
          onChange={(e) =>
            set('registrationName', (e.target as HTMLInputElement).value)
          }
          placeholder="Legal registered company name"
          aria-invalid={!!errors.registrationName}
        />
        {errors.registrationName && (
          <FieldError errors={[{ message: errors.registrationName }]} />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>
            Phone number <RequiredMark />
          </FieldLabel>
          <PhoneInput
            value={form.businessPhone}
            onChange={(v) => set('businessPhone', v)}
            aria-invalid={!!errors.businessPhone}
          />
          {errors.businessPhone && (
            <FieldError errors={[{ message: errors.businessPhone }]} />
          )}
        </Field>
        <Field>
          <FieldLabel>Email address</FieldLabel>
          <TextInput
            type="email"
            value={form.businessEmail}
            onChange={(e) =>
              set('businessEmail', (e.target as HTMLInputElement).value)
            }
            placeholder="Company email address"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel>Customer reference</FieldLabel>
        <TextInput
          value={form.reference}
          onChange={(e) =>
            set('reference', (e.target as HTMLInputElement).value)
          }
          placeholder="Internal reference (optional)"
        />
      </Field>
    </div>
  )
}

// ─── Step 3: Address (shared) ────────────────────────────────────────────────────

export function StepAddress({
  form,
  set,
  errors,
  countryOptions,
  stateOptions,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
  countryOptions: CountryOption[]
  stateOptions: CountryOption[]
}) {
  return (
    <div className="space-y-5">
      <Field>
        <FieldLabel>
          Address line one <RequiredMark />
        </FieldLabel>
        <TextInput
          value={form.addressLineOne}
          onChange={(e) =>
            set('addressLineOne', (e.target as HTMLInputElement).value)
          }
          placeholder="Address line one"
          aria-invalid={!!errors.addressLineOne}
        />
        {errors.addressLineOne && (
          <FieldError errors={[{ message: errors.addressLineOne }]} />
        )}
      </Field>

      <Field>
        <FieldLabel>Address line two</FieldLabel>
        <TextInput
          value={form.addressLineTwo}
          onChange={(e) =>
            set('addressLineTwo', (e.target as HTMLInputElement).value)
          }
          placeholder="Address line two"
        />
      </Field>

      <Field>
        <FieldLabel>
          Postal code <RequiredMark />
        </FieldLabel>
        <TextInput
          value={form.postalCode}
          onChange={(e) =>
            set('postalCode', (e.target as HTMLInputElement).value)
          }
          placeholder="Postal code"
          aria-invalid={!!errors.postalCode}
        />
        {errors.postalCode && (
          <FieldError errors={[{ message: errors.postalCode }]} />
        )}
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field>
          <FieldLabel>
            Country <RequiredMark />
          </FieldLabel>
          <SelectInput
            options={countryOptions}
            value={form.countryCode}
            onChange={(v) => {
              set('countryCode', v)
              set('stateCode', '')
            }}
            placeholder="Select country"
            searchable
          />
          {errors.countryCode && (
            <FieldError errors={[{ message: errors.countryCode }]} />
          )}
        </Field>
        <Field>
          <FieldLabel>
            State <RequiredMark />
          </FieldLabel>
          <SelectInput
            options={stateOptions}
            value={form.stateCode}
            onChange={(v) => set('stateCode', v)}
            placeholder="Select state"
            searchable
            disabled={!form.countryCode}
          />
          {errors.stateCode && (
            <FieldError errors={[{ message: errors.stateCode }]} />
          )}
        </Field>
        <Field>
          <FieldLabel>
            City <RequiredMark />
          </FieldLabel>
          <TextInput
            value={form.city}
            onChange={(e) =>
              set('city', (e.target as HTMLInputElement).value)
            }
            placeholder="City"
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

// ─── Step 4 (Individual): Identity & Verification ────────────────────────────────

export function StepIndividualIdentity({
  form,
  set,
  errors,
  countryOptions,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
  countryOptions: CountryOption[]
}) {
  const tier = getTierFromVerificationType(form.verificationType)
  const requiresIdentity = tier === 'tier-2' || tier === 'tier-3'

  return (
    <div className="space-y-5">
      <Field>
        <FieldLabel>Verification tier</FieldLabel>
        <Select
          value={form.verificationType}
          onValueChange={(v) => {
            set('verificationType', v)
            const newTier = getTierFromVerificationType(v)
            if (newTier !== 'tier-2' && newTier !== 'tier-3') {
              set('idType', '')
              set('idNumber', '')
              set('idDocumentUrl', '')
              set('issuingCountry', '')
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {VERIFICATION_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {requiresIdentity && (
        <>
          <Field>
            <FieldLabel>
              ID type <RequiredMark />
            </FieldLabel>
            <Select
              value={form.idType}
              onValueChange={(v) => set('idType', v)}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={!!errors.idType}
              >
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                {ID_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.idType && (
              <FieldError errors={[{ message: errors.idType }]} />
            )}
          </Field>

          <Field>
            <FieldLabel>
              Identification number <RequiredMark />
            </FieldLabel>
            <TextInput
              value={form.idNumber}
              onChange={(e) =>
                set('idNumber', (e.target as HTMLInputElement).value)
              }
              placeholder="ID card number"
              aria-invalid={!!errors.idNumber}
            />
            {errors.idNumber && (
              <FieldError errors={[{ message: errors.idNumber }]} />
            )}
          </Field>

          <Field>
            <FieldLabel>
              Identity document <RequiredMark />
            </FieldLabel>
            <FileUpload
              onFileUpload={({ file }, cb) =>
                uploadTempFile(file, cb, (url) => set('idDocumentUrl', url))
              }
              onFileRemove={() => set('idDocumentUrl', '')}
              maxFiles={1}
              maxFileSize={5 * 1024 * 1024}
              acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
              size="large"
              dropZoneLabel="Upload identity document"
              dropZoneDescription="PNG, JPG or PDF (max. 5MB)"
            />
            {errors.idDocumentUrl && (
              <FieldError errors={[{ message: errors.idDocumentUrl }]} />
            )}
          </Field>

          <Field>
            <FieldLabel>
              Issuing country <RequiredMark />
            </FieldLabel>
            <SelectInput
              options={countryOptions}
              value={form.issuingCountry}
              onChange={(v) => set('issuingCountry', v)}
              placeholder="Select country"
              searchable
            />
            {errors.issuingCountry && (
              <FieldError errors={[{ message: errors.issuingCountry }]} />
            )}
          </Field>
        </>
      )}
    </div>
  )
}

// ─── Step 4 (Business): Business Identity ────────────────────────────────────────

export function StepBusinessIdentity({
  form,
  set,
  errors,
  countryOptions,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  errors: FieldErrors
  countryOptions: CountryOption[]
}) {
  return (
    <div className="space-y-5">
      <Field>
        <FieldLabel>Verification tier</FieldLabel>
        <Select
          value={form.verificationType}
          onValueChange={(v) => set('verificationType', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {VERIFICATION_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>
          CAC registration number <RequiredMark />
        </FieldLabel>
        <TextInput
          value={form.businessIdNumber}
          onChange={(e) =>
            set('businessIdNumber', (e.target as HTMLInputElement).value)
          }
          placeholder="RC000000"
          aria-invalid={!!errors.businessIdNumber}
        />
        {errors.businessIdNumber && (
          <FieldError errors={[{ message: errors.businessIdNumber }]} />
        )}
      </Field>

      <Field>
        <FieldLabel>
          Issuing country <RequiredMark />
        </FieldLabel>
        <SelectInput
          options={countryOptions}
          value={form.businessIssuingCountry}
          onChange={(v) => set('businessIssuingCountry', v)}
          placeholder="Select country"
          searchable
        />
        {errors.businessIssuingCountry && (
          <FieldError errors={[{ message: errors.businessIssuingCountry }]} />
        )}
      </Field>

      <Field>
        <FieldLabel>Business document</FieldLabel>
        <FileUpload
          onFileUpload={({ file }, cb) =>
            uploadTempFile(file, cb, (url) => set('businessIdUrl', url))
          }
          onFileRemove={() => set('businessIdUrl', '')}
          maxFiles={1}
          maxFileSize={5 * 1024 * 1024}
          acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
          size="large"
          dropZoneLabel="Upload business document"
          dropZoneDescription="PNG, JPG or PDF (max. 5MB)"
        />
      </Field>
    </div>
  )
}

// ─── Step 5 (Business): Directors ────────────────────────────────────────────────

function DirectorForm({
  value,
  onChange,
  errors,
  countryOptions,
  onSubmit,
  onCancel,
}: {
  value: Omit<DirectorFormState, 'id'>
  onChange: (k: keyof Omit<DirectorFormState, 'id'>, v: string) => void
  errors: FieldErrors
  countryOptions: CountryOption[]
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border-primary-light p-4">
      <p className="text-sm font-semibold text-content-primary">Director details</p>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Title</FieldLabel>
          <Select value={value.title} onValueChange={(v) => onChange('title', v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              {TITLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Gender</FieldLabel>
          <Select value={value.gender} onValueChange={(v) => onChange('gender', v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>
            First name <RequiredMark />
          </FieldLabel>
          <TextInput
            value={value.firstName}
            onChange={(e) => onChange('firstName', (e.target as HTMLInputElement).value)}
            placeholder="First name"
            aria-invalid={!!errors.firstName}
          />
          {errors.firstName && <FieldError errors={[{ message: errors.firstName }]} />}
        </Field>
        <Field>
          <FieldLabel>Middle name</FieldLabel>
          <TextInput
            value={value.middleName}
            onChange={(e) => onChange('middleName', (e.target as HTMLInputElement).value)}
            placeholder="Middle name"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel>
          Last name <RequiredMark />
        </FieldLabel>
        <TextInput
          value={value.lastName}
          onChange={(e) => onChange('lastName', (e.target as HTMLInputElement).value)}
          placeholder="Last name"
          aria-invalid={!!errors.lastName}
        />
        {errors.lastName && <FieldError errors={[{ message: errors.lastName }]} />}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>
            Phone number <RequiredMark />
          </FieldLabel>
          <PhoneInput
            value={value.phoneNumber}
            onChange={(v) => onChange('phoneNumber', v)}
            aria-invalid={!!errors.phoneNumber}
          />
          {errors.phoneNumber && <FieldError errors={[{ message: errors.phoneNumber }]} />}
        </Field>
        <Field>
          <FieldLabel>Email address</FieldLabel>
          <TextInput
            type="email"
            value={value.email}
            onChange={(e) => onChange('email', (e.target as HTMLInputElement).value)}
            placeholder="Email address"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Date of birth</FieldLabel>
          <TextInput
            type="date"
            value={value.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', (e.target as HTMLInputElement).value)}
          />
        </Field>
        <Field>
          <FieldLabel>
            Nationality <RequiredMark />
          </FieldLabel>
          <SelectInput
            options={countryOptions}
            value={value.nationalityCode}
            onChange={(v) => onChange('nationalityCode', v)}
            placeholder="Select nationality"
            searchable
          />
          {errors.nationalityCode && (
            <FieldError errors={[{ message: errors.nationalityCode }]} />
          )}
        </Field>
      </div>

      <div className="border-t border-border-primary-light pt-4 space-y-4">
        <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide">
          Identity document
        </p>

        <Field>
          <FieldLabel>
            ID type <RequiredMark />
          </FieldLabel>
          <Select value={value.idType} onValueChange={(v) => onChange('idType', v)}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.idType}>
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.idType && <FieldError errors={[{ message: errors.idType }]} />}
        </Field>

        <Field>
          <FieldLabel>
            Identification number <RequiredMark />
          </FieldLabel>
          <TextInput
            value={value.idNumber}
            onChange={(e) => onChange('idNumber', (e.target as HTMLInputElement).value)}
            placeholder="ID card number"
            aria-invalid={!!errors.idNumber}
          />
          {errors.idNumber && <FieldError errors={[{ message: errors.idNumber }]} />}
        </Field>

        <Field>
          <FieldLabel>Identity document</FieldLabel>
          <FileUpload
            onFileUpload={({ file }, cb) =>
              uploadTempFile(file, cb, (url) => onChange('idDocumentUrl', url))
            }
            onFileRemove={() => onChange('idDocumentUrl', '')}
            maxFiles={1}
            maxFileSize={5 * 1024 * 1024}
            acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
            size="large"
            dropZoneLabel="Upload identity document"
            dropZoneDescription="PNG, JPG or PDF (max. 5MB)"
          />
        </Field>

        <Field>
          <FieldLabel>
            Issuing country <RequiredMark />
          </FieldLabel>
          <SelectInput
            options={countryOptions}
            value={value.issuingCountry}
            onChange={(v) => onChange('issuingCountry', v)}
            placeholder="Select country"
            searchable
          />
          {errors.issuingCountry && (
            <FieldError errors={[{ message: errors.issuingCountry }]} />
          )}
        </Field>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" onClick={onSubmit}>
          Add director
        </Button>
        <Button
          type="button"
          variant="outline"
          color="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function StepDirectors({
  directors,
  onAdd,
  onRemove,
  errors,
  countryOptions,
}: {
  directors: DirectorFormState[]
  onAdd: (d: Omit<DirectorFormState, 'id'>) => void
  onRemove: (id: string) => void
  errors: FieldErrors
  countryOptions: CountryOption[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] =
    useState<Omit<DirectorFormState, 'id'>>(INITIAL_DIRECTOR)
  const [draftErrors, setDraftErrors] = useState<FieldErrors>({})

  function setDir(
    k: keyof Omit<DirectorFormState, 'id'>,
    v: string,
  ) {
    setDraft((prev) => ({ ...prev, [k]: v }))
    if (draftErrors[k]) {
      setDraftErrors((prev) => {
        const next = { ...prev }
        delete next[k]
        return next
      })
    }
  }

  function handleAdd() {
    const errs = validateDirector(draft)
    if (Object.keys(errs).length > 0) {
      setDraftErrors(errs)
      return
    }
    onAdd(draft)
    setDraft(INITIAL_DIRECTOR)
    setDraftErrors({})
    setShowForm(false)
  }

  function handleCancel() {
    setDraft(INITIAL_DIRECTOR)
    setDraftErrors({})
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {directors.length > 0 && (
        <div className="rounded-xl border border-border-primary-light divide-y divide-border-primary-light overflow-hidden">
          {directors.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-content-primary">
                  {[d.firstName, d.middleName, d.lastName]
                    .filter(Boolean)
                    .join(' ')}
                </p>
                <p className="text-xs text-content-tertiary mt-0.5">
                  {ID_TYPE_OPTIONS.find((o) => o.value === d.idType)?.label ??
                    d.idType}{' '}
                  &middot; {d.idNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(d.id)}
                className="text-content-quaternary hover:text-feedback-danger-main transition-colors"
                aria-label="Remove director"
              >
                <Trash2 width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {errors.directors && (
        <FieldError errors={[{ message: errors.directors }]} />
      )}

      {showForm ? (
        <DirectorForm
          value={draft}
          onChange={setDir}
          errors={draftErrors}
          countryOptions={countryOptions}
          onSubmit={handleAdd}
          onCancel={handleCancel}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          color="secondary"
          onClick={() => setShowForm(true)}
        >
          <Plus width={16} height={16} />
          Add director
        </Button>
      )}
    </div>
  )
}

// ─── Step Metadata (shared) ──────────────────────────────────────────────────────

export function StepMetadata({
  metadataItems,
  onAdd,
  onRemove,
}: {
  metadataItems: { key: string; value: string }[]
  onAdd: (key: string, value: string) => void
  onRemove: (index: number) => void
}) {
  const [metaKey, setMetaKey] = useState('')
  const [metaValue, setMetaValue] = useState('')

  const handleAdd = () => {
    if (!metaKey.trim() || !metaValue.trim()) return
    onAdd(metaKey.trim(), metaValue.trim())
    setMetaKey('')
    setMetaValue('')
  }

  return (
    <div className="space-y-5">
      {metadataItems.length > 0 && (
        <div className="rounded-xl border border-border-primary-light divide-y divide-border-primary-light overflow-hidden">
          {metadataItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs bg-surface-secondary border border-border-primary-light px-2 py-0.5 rounded text-content-secondary">
                  {item.key}
                </span>
                <span className="text-content-tertiary">&rarr;</span>
                <span className="text-content-primary">{item.value}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-content-quaternary hover:text-feedback-danger-main transition-colors text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Key</FieldLabel>
          <TextInput
            value={metaKey}
            onChange={(e) => setMetaKey((e.target as HTMLInputElement).value)}
            placeholder="e.g. department"
          />
        </Field>
        <Field>
          <FieldLabel>Value</FieldLabel>
          <TextInput
            value={metaValue}
            onChange={(e) => setMetaValue((e.target as HTMLInputElement).value)}
            placeholder="e.g. engineering"
          />
        </Field>
      </div>

      <Button
        type="button"
        variant="outline"
        color="secondary"
        disabled={!metaKey.trim() || !metaValue.trim()}
        onClick={handleAdd}
      >
        Add entry
      </Button>
    </div>
  )
}

// ─── Step Review ─────────────────────────────────────────────────────────────────

export function StepReview({
  form,
  directors,
  metadataItems,
  onEdit,
  countryOptions,
  stateOptions,
}: {
  form: FormState
  directors: DirectorFormState[]
  metadataItems: { key: string; value: string }[]
  onEdit: (stepId: number) => void
  countryOptions: CountryOption[]
  stateOptions: CountryOption[]
}) {
  const countryLabel = (code: string) =>
    countryOptions.find((c) => c.value === code)?.label || code
  const stateLabel = (code: string) =>
    stateOptions.find((s) => s.value === code)?.label || code
  const genderLabel = (g: string) =>
    GENDER_OPTIONS.find((o) => o.value === g)?.label || ''
  const idTypeLabel = (t: string) =>
    ID_TYPE_OPTIONS.find((o) => o.value === t)?.label || ''
  const verificationLabel =
    VERIFICATION_TYPE_OPTIONS.find((v) => v.value === form.verificationType)
      ?.label || ''

  const isIndividual = form.customerType === 'individual'

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border-primary-light bg-surface-secondary/50 px-4 py-3">
        <p className="text-sm text-content-secondary">
          Review the details below before creating the customer. Click edit to
          make changes.
        </p>
      </div>

      {/* Customer type */}
      <ReviewSection title="Customer type" stepId={1} onEdit={onEdit}>
        <ReviewRow
          label="Type"
          value={isIndividual ? 'Individual' : 'Business'}
        />
        {form.reference && (
          <ReviewRow label="Reference" value={form.reference} />
        )}
      </ReviewSection>

      <div className="border-t border-border-primary-light" />

      {isIndividual ? (
        <>
          {/* Individual info */}
          <ReviewSection title="Personal information" stepId={2} onEdit={onEdit}>
            <ReviewRow
              label="Name"
              value={[form.firstName, form.middleName, form.lastName]
                .filter(Boolean)
                .join(' ')}
            />
            {form.title && <ReviewRow label="Title" value={form.title} />}
            {form.gender && (
              <ReviewRow label="Gender" value={genderLabel(form.gender)} />
            )}
            <ReviewRow label="Email" value={form.email} />
            <ReviewRow label="Phone" value={form.phoneNumber} />
            {form.dateOfBirth && (
              <ReviewRow label="Date of birth" value={form.dateOfBirth} />
            )}
            <ReviewRow
              label="Nationality"
              value={countryLabel(form.nationalityCode)}
            />
          </ReviewSection>

          <div className="border-t border-border-primary-light" />

          {/* Address */}
          <ReviewSection title="Address" stepId={3} onEdit={onEdit}>
            <ReviewRow
              label="Address"
              value={[form.addressLineOne, form.addressLineTwo]
                .filter(Boolean)
                .join(', ')}
            />
            {form.postalCode && (
              <ReviewRow label="Postal code" value={form.postalCode} />
            )}
            <ReviewRow
              label="Location"
              value={[
                form.city,
                form.stateCode ? stateLabel(form.stateCode) : '',
                form.countryCode ? countryLabel(form.countryCode) : '',
              ]
                .filter(Boolean)
                .join(', ')}
            />
          </ReviewSection>

          <div className="border-t border-border-primary-light" />

          {/* Identity */}
          <ReviewSection
            title="Identity & verification"
            stepId={4}
            onEdit={onEdit}
          >
            {form.verificationType && form.verificationType !== 'none' ? (
              <ReviewRow label="Verification" value={verificationLabel} />
            ) : (
              <ReviewRow label="Verification" value="None" />
            )}
            {form.idType && (
              <ReviewRow label="ID type" value={idTypeLabel(form.idType)} />
            )}
            {form.idNumber && (
              <ReviewRow label="ID number" value={form.idNumber} />
            )}
            {form.issuingCountry && (
              <ReviewRow
                label="Issuing country"
                value={countryLabel(form.issuingCountry)}
              />
            )}
            {form.idDocumentUrl && (
              <ReviewRow label="Document" value="Uploaded" />
            )}
          </ReviewSection>
        </>
      ) : (
        <>
          {/* Business info */}
          <ReviewSection
            title="Business information"
            stepId={2}
            onEdit={onEdit}
          >
            <ReviewRow
              label="Registration name"
              value={form.registrationName}
            />
            <ReviewRow label="Phone" value={form.businessPhone} />
            {form.businessEmail && (
              <ReviewRow label="Email" value={form.businessEmail} />
            )}
          </ReviewSection>

          <div className="border-t border-border-primary-light" />

          {/* Business address */}
          <ReviewSection title="Business address" stepId={3} onEdit={onEdit}>
            <ReviewRow
              label="Address"
              value={[form.addressLineOne, form.addressLineTwo]
                .filter(Boolean)
                .join(', ')}
            />
            {form.postalCode && (
              <ReviewRow label="Postal code" value={form.postalCode} />
            )}
            <ReviewRow
              label="Location"
              value={[
                form.city,
                form.stateCode ? stateLabel(form.stateCode) : '',
                form.countryCode ? countryLabel(form.countryCode) : '',
              ]
                .filter(Boolean)
                .join(', ')}
            />
          </ReviewSection>

          <div className="border-t border-border-primary-light" />

          {/* Business identity */}
          <ReviewSection
            title="Business identity"
            stepId={4}
            onEdit={onEdit}
          >
            {form.verificationType && form.verificationType !== 'none' ? (
              <ReviewRow label="Verification" value={verificationLabel} />
            ) : (
              <ReviewRow label="Verification" value="None" />
            )}
            <ReviewRow label="Type" value="CAC" />
            <ReviewRow
              label="Registration number"
              value={form.businessIdNumber}
            />
            {form.businessIssuingCountry && (
              <ReviewRow
                label="Issuing country"
                value={countryLabel(form.businessIssuingCountry)}
              />
            )}
            {form.businessIdUrl && (
              <ReviewRow label="Document" value="Uploaded" />
            )}
          </ReviewSection>

          {directors.length > 0 && (
            <>
              <div className="border-t border-border-primary-light" />
              <ReviewSection title="Directors" stepId={5} onEdit={onEdit}>
                {directors.map((d) => (
                  <div
                    key={d.id}
                    className="py-1.5 flex items-baseline justify-between gap-4"
                  >
                    <span className="text-sm text-content-primary">
                      {[d.firstName, d.middleName, d.lastName]
                        .filter(Boolean)
                        .join(' ')}
                    </span>
                    <span className="text-xs text-content-tertiary shrink-0">
                      {idTypeLabel(d.idType)} &middot; {d.idNumber}
                    </span>
                  </div>
                ))}
              </ReviewSection>
            </>
          )}
        </>
      )}

      {metadataItems.length > 0 && (
        <>
          <div className="border-t border-border-primary-light" />
          <ReviewSection
            title="Metadata"
            stepId={isIndividual ? 5 : 6}
            onEdit={onEdit}
          >
            {metadataItems.map((item, i) => (
              <ReviewRow key={i} label={item.key} value={item.value} />
            ))}
          </ReviewSection>
        </>
      )}
    </div>
  )
}
