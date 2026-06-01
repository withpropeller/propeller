'use client'

import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Pencil, Trash2, Plus } from 'lucide-react'
import {
  Field,
  FieldLabel,
  FieldError,
  TextInput,
  Textarea,
  Button,
  Skeleton,
  FileUpload,
  toast,
} from '@/lib/pax'
import { SelectInput } from '@/components/ui/SelectInput'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { COUNTRIES, STORAGE_KEYS, API_BASE_URL } from '@/lib/constants'
import {
  useBusinessKYCControllerGetKyc,
  useBusinessKYCControllerCreateKYC,
  useBusinessKYCControllerUpdateBusinessInfo,
  useBusinessKYCControllerUpdateBusinessAddress,
  useBusinessKYCControllerAddLeadership,
  useBusinessKYCControllerDeleteLeadership,
  useBusinessKYCControllerSubmitKyc,
  getBusinessKYCControllerGetKycQueryKey,
} from '@/api/business-kyc/business-kyc'
import {
  getBusinessControllerFindQueryKey,
  useBusinessControllerFind,
} from '@/api/business/business'
import type { ApiHydratedBusinessKYC, BusinessLeadership, KYCLeadershipDto } from '@/api/model'

// ─── Constants ───────────────────────────────────────────────────────────────

const REGISTRATION_TYPES = [
  { value: 'private-limited-company', label: 'Private Limited Company' },
  { value: 'company-limited-by-guarantee', label: 'Company Limited by Guarantee' },
  { value: 'public-limited-company', label: 'Public Limited Company' },
  { value: 'business-name', label: 'Business Name' },
  { value: 'unlimited-company', label: 'Unlimited Company' },
  { value: 'incorporated-trustees', label: 'Incorporated Trustees' },
]

const DIRECTOR_ROLES = [
  { value: 'founder', label: 'Founder' },
  { value: 'co-founder', label: 'Co-Founder' },
  { value: 'ceo', label: 'CEO' },
  { value: 'director', label: 'Director' },
  { value: 'cfo', label: 'CFO' },
]

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
].map((s) => ({ value: s, label: s }))

const NATIONALITY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }))

// ─── File upload util ─────────────────────────────────────────────────────────

type UploadCallback = (state: {
  progress: number
  error?: string
  path?: string
  status: 'upload_idle' | 'upload_ongoing' | 'upload_success' | 'upload_failed' | 'file_invalid' | 'file_valid'
}) => void

async function submitKycDocumentation(
  kycId: string,
  cacCertificate: File,
  applicationDoc: File,
): Promise<void> {
  const formData = new FormData()
  formData.append('cacCertificate', cacCertificate)
  formData.append('applicationDoc', applicationDoc)
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null
  const mode =
    typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) ?? 'sandbox')
      : 'sandbox'
  const res = await fetch(`${API_BASE_URL}/business/kyc/${kycId}/documentation`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-dashboard-mode': mode,
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw {
      status: res.status,
      message: json.message ?? 'Failed to save documents',
      code: json.code ?? 'error',
      errors: json.error,
    }
  }
}

async function uploadFile(file: File, onProgress: UploadCallback, onSuccess: (url: string) => void) {
  onProgress({ progress: 0, status: 'upload_ongoing' })
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
    onSuccess(url)
    onProgress({ progress: 100, path: url, status: 'upload_success' })
  } catch {
    onProgress({ progress: 0, status: 'upload_failed', error: 'Upload failed. Please try again.' })
  }
}

// ─── API error parsing ────────────────────────────────────────────────────────

function parseApiError(err: any): { fieldErrors: Record<string, string>; generalError: string | null } {
  if (Array.isArray(err?.errors) && err.errors.length > 0) {
    const fieldErrors: Record<string, string> = {}
    for (const e of err.errors) {
      fieldErrors[e.property] = e.error
    }
    return { fieldErrors, generalError: null }
  }
  return { fieldErrors: {}, generalError: err?.message ?? 'Something went wrong' }
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StatusBadge({ done }: { done: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
        done
          ? 'bg-feedback-success-light text-feedback-success-dark'
          : 'bg-feedback-warning-light text-feedback-warning-dark',
      ].join(' ')}
    >
      {done ? <CheckCircle width={12} height={12} /> : <span className="w-3 h-3 rounded-full border border-current flex-none" />}
      {done ? 'Complete' : 'Pending'}
    </span>
  )
}

function SectionCard({
  title,
  description,
  isDone,
  isExpanded,
  onToggle,
  children,
}: {
  title: string
  description: string
  isDone: boolean
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className={['rounded-xl border transition-colors', isExpanded ? 'border-action-primary-main' : 'border-border-primary-light'].join(' ')}>
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-content-primary">{title}</p>
          <p className="text-xs text-content-tertiary mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge done={isDone} />
          {!isDone && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={isExpanded ? `Close ${title}` : `Edit ${title}`}
              className="w-8 h-8 rounded-lg border border-border-primary-light flex items-center justify-center text-content-tertiary hover:text-content-primary hover:border-border-primary-main transition-colors"
            >
              <Pencil width={13} height={13} />
            </button>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-border-primary-light px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Section 1: Business Information ─────────────────────────────────────────

function BusinessInfoSection({
  kyc,
  kycId,
  isExpanded,
  onToggle,
  onSaved,
}: {
  kyc: ApiHydratedBusinessKYC | undefined
  kycId: string
  isExpanded: boolean
  onToggle: () => void
  onSaved: () => void
}) {
  const existing = kyc?.information
  const [form, setForm] = useState({
    businessName: existing?.businessName ?? '',
    businessDescription: existing?.businessDescription ?? '',
    registrationType: existing?.registrationType ?? '',
    registrationNumber: existing?.registrationNumber ?? '',
    tin: existing?.tin ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})

  const createKYC = useBusinessKYCControllerCreateKYC()
  const updateInfo = useBusinessKYCControllerUpdateBusinessInfo()
  const isPending = createKYC.isPending || updateInfo.isPending

  useEffect(() => {
    if (existing) {
      setForm({
        businessName: existing.businessName ?? '',
        businessDescription: existing.businessDescription ?? '',
        registrationType: existing.registrationType ?? '',
        registrationNumber: existing.registrationNumber ?? '',
        tin: existing.tin ?? '',
      })
    }
  }, [existing])

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setApiErrors((e) => { const next = { ...e }; delete next[key]; return next })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.businessName.trim()) e.businessName = 'Required'
    if (!form.businessDescription.trim()) e.businessDescription = 'Required'
    if (!form.registrationType) e.registrationType = 'Required'
    if (!form.registrationNumber.trim()) e.registrationNumber = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const data = {
      businessName: form.businessName,
      businessDescription: form.businessDescription,
      registrationType: form.registrationType,
      registrationNumber: form.registrationNumber,
      ...(form.tin ? { tin: form.tin } : {}),
    }
    const mutateOptions = {
      onSuccess: () => {
        toast({ title: 'Business information saved', severity: 'success' } as any)
        onSaved()
      },
      onError: (err: any) => {
        const { fieldErrors, generalError } = parseApiError(err)
        if (Object.keys(fieldErrors).length > 0) {
          setApiErrors(fieldErrors)
        } else {
          toast({ title: generalError, severity: 'error' } as any)
        }
      },
    }
    if (kycId) {
      updateInfo.mutate({ id: kycId, data }, mutateOptions)
    } else {
      createKYC.mutate({ data }, mutateOptions)
    }
  }

  return (
    <SectionCard
      title="Basic Business Information"
      description="Registered company name, type, and registration details"
      isDone={!!existing}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field>
          <FieldLabel>Business name <span className="text-feedback-error-main">*</span></FieldLabel>
          <TextInput
            value={form.businessName}
            onChange={(e) => set('businessName', (e.target as HTMLInputElement).value)}
            placeholder="Registered name of your business"
            aria-invalid={!!(errors.businessName || apiErrors.businessName)}
          />
          {(errors.businessName || apiErrors.businessName) && <FieldError errors={[{ message: errors.businessName || apiErrors.businessName }]} />}
        </Field>

        <Field>
          <FieldLabel>Business description <span className="text-feedback-error-main">*</span></FieldLabel>
          <Textarea
            value={form.businessDescription}
            onChange={(e) => set('businessDescription', (e.target as HTMLTextAreaElement).value)}
            placeholder="Brief description of your business activities"
            rows={3}
            aria-invalid={!!(errors.businessDescription || apiErrors.businessDescription)}
          />
          {(errors.businessDescription || apiErrors.businessDescription) && <FieldError errors={[{ message: errors.businessDescription || apiErrors.businessDescription }]} />}
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field>
            <FieldLabel>Registration type <span className="text-feedback-error-main">*</span></FieldLabel>
            <SelectInput
              options={REGISTRATION_TYPES}
              value={form.registrationType}
              onChange={(v) => set('registrationType', v)}
              placeholder="Select type"
            />
            {(errors.registrationType || apiErrors.registrationType) && <FieldError errors={[{ message: errors.registrationType || apiErrors.registrationType }]} />}
          </Field>

          <Field>
            <FieldLabel>Registration number <span className="text-feedback-error-main">*</span></FieldLabel>
            <TextInput
              value={form.registrationNumber}
              onChange={(e) => set('registrationNumber', (e.target as HTMLInputElement).value)}
              placeholder="CAC registration number"
              aria-invalid={!!(errors.registrationNumber || apiErrors.registrationNumber)}
            />
            {(errors.registrationNumber || apiErrors.registrationNumber) && <FieldError errors={[{ message: errors.registrationNumber || apiErrors.registrationNumber }]} />}
          </Field>

          <Field>
            <FieldLabel>Tax ID (TIN) <span className="text-content-tertiary text-xs font-normal">optional</span></FieldLabel>
            <TextInput
              value={form.tin}
              onChange={(e) => set('tin', (e.target as HTMLInputElement).value)}
              placeholder="Business TIN"
              aria-invalid={!!apiErrors.tin}
            />
            {apiErrors.tin && <FieldError errors={[{ message: apiErrors.tin }]} />}
          </Field>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" color="primary" size="sm" disabled={isPending} loading={isPending}>
            Save & continue
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

// ─── Section 2: Operating Address ─────────────────────────────────────────────

function AddressSection({
  kyc,
  kycId,
  isExpanded,
  onToggle,
  onSaved,
}: {
  kyc: ApiHydratedBusinessKYC | undefined
  kycId: string
  isExpanded: boolean
  onToggle: () => void
  onSaved: () => void
}) {
  const existing = kyc?.address
  const [form, setForm] = useState({
    addressLineOne: existing?.addressLineOne ?? '',
    addressLineTwo: existing?.addressLineTwo ?? '',
    city: existing?.city ?? '',
    state: existing?.state ?? '',
    phone: existing?.phone ?? '',
    email: existing?.email ?? '',
    countryCode: existing?.countryCode ?? 'NG',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})

  const updateAddress = useBusinessKYCControllerUpdateBusinessAddress()

  useEffect(() => {
    if (existing) {
      setForm({
        addressLineOne: existing.addressLineOne ?? '',
        addressLineTwo: existing.addressLineTwo ?? '',
        city: existing.city ?? '',
        state: existing.state ?? '',
        phone: existing.phone ?? '',
        email: existing.email ?? '',
        countryCode: existing.countryCode ?? 'NG',
      })
    }
  }, [existing])

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setApiErrors((e) => { const next = { ...e }; delete next[key]; return next })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.addressLineOne.trim()) e.addressLineOne = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.state) e.state = 'Required'
    if (!form.phone.trim()) e.phone = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Must be a valid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (!kycId) return
    updateAddress.mutate(
      { id: kycId, data: form },
      {
        onSuccess: () => {
          toast({ title: 'Address saved', severity: 'success' } as any)
          onSaved()
        },
        onError: (err: any) => {
          const { fieldErrors, generalError } = parseApiError(err)
          if (Object.keys(fieldErrors).length > 0) {
            setApiErrors(fieldErrors)
          } else {
            toast({ title: generalError, severity: 'error' } as any)
          }
        },
      },
    )
  }

  return (
    <SectionCard
      title="Operating Address"
      description="The address from where your business currently operates"
      isDone={!!existing}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field>
          <FieldLabel>Address line 1 <span className="text-feedback-error-main">*</span></FieldLabel>
          <TextInput
            value={form.addressLineOne}
            onChange={(e) => set('addressLineOne', (e.target as HTMLInputElement).value)}
            placeholder="Street address"
            aria-invalid={!!(errors.addressLineOne || apiErrors.addressLineOne)}
          />
          {(errors.addressLineOne || apiErrors.addressLineOne) && <FieldError errors={[{ message: errors.addressLineOne || apiErrors.addressLineOne }]} />}
        </Field>

        <Field>
          <FieldLabel>Address line 2 <span className="text-content-tertiary text-xs font-normal">optional</span></FieldLabel>
          <TextInput
            value={form.addressLineTwo}
            onChange={(e) => set('addressLineTwo', (e.target as HTMLInputElement).value)}
            placeholder="Apartment, suite, floor, etc."
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>State <span className="text-feedback-error-main">*</span></FieldLabel>
            <SelectInput
              options={NIGERIAN_STATES}
              value={form.state}
              onChange={(v) => set('state', v)}
              placeholder="Select state"
              searchable
            />
            {(errors.state || apiErrors.state) && <FieldError errors={[{ message: errors.state || apiErrors.state }]} />}
          </Field>

          <Field>
            <FieldLabel>City <span className="text-feedback-error-main">*</span></FieldLabel>
            <TextInput
              value={form.city}
              onChange={(e) => set('city', (e.target as HTMLInputElement).value)}
              placeholder="City"
              aria-invalid={!!(errors.city || apiErrors.city)}
            />
            {(errors.city || apiErrors.city) && <FieldError errors={[{ message: errors.city || apiErrors.city }]} />}
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Contact phone <span className="text-feedback-error-main">*</span></FieldLabel>
            <PhoneInput
              value={form.phone}
              onChange={(v) => set('phone', v)}
              aria-invalid={!!(errors.phone || apiErrors.phone)}
            />
            {(errors.phone || apiErrors.phone) && <FieldError errors={[{ message: errors.phone || apiErrors.phone }]} />}
          </Field>

          <Field>
            <FieldLabel>Contact email <span className="text-feedback-error-main">*</span></FieldLabel>
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => set('email', (e.target as HTMLInputElement).value)}
              placeholder="business@example.com"
              aria-invalid={!!(errors.email || apiErrors.email)}
            />
            {(errors.email || apiErrors.email) && <FieldError errors={[{ message: errors.email || apiErrors.email }]} />}
          </Field>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" color="primary" size="sm" disabled={updateAddress.isPending} loading={updateAddress.isPending}>
            Save & continue
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

// ─── Section 3: Directors ─────────────────────────────────────────────────────

function DirectorsSection({
  kyc,
  kycId,
  isExpanded,
  onToggle,
  onSaved,
}: {
  kyc: ApiHydratedBusinessKYC | undefined
  kycId: string
  isExpanded: boolean
  onToggle: () => void
  onSaved: () => void
}) {
  const directors = kyc?.directors ?? []
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    nationalityCode: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    bvn: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})

  const addDirector = useBusinessKYCControllerAddLeadership()
  const deleteDirector = useBusinessKYCControllerDeleteLeadership()

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setApiErrors((e) => { const next = { ...e }; delete next[key]; return next })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.role) e.role = 'Required'
    if (!form.nationalityCode) e.nationalityCode = 'Required'
    if (!form.phone.trim()) e.phone = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Must be a valid email'
    if (!form.dateOfBirth) e.dateOfBirth = 'Required'
    if (!form.bvn.trim()) e.bvn = 'Required'
    else if (!/^\d{11}$/.test(form.bvn.trim())) e.bvn = 'BVN must be 11 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !kycId) return
    const data: KYCLeadershipDto = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      role: form.role,
      nationalityCode: form.nationalityCode,
      phone: form.phone,
      email: form.email.trim(),
      dateOfBirth: form.dateOfBirth,
      bvn: form.bvn.trim(),
    }
    addDirector.mutate(
      { id: kycId, data },
      {
        onSuccess: () => {
          toast({ title: 'Director added', severity: 'success' } as any)
          setForm({
            firstName: '',
            lastName: '',
            role: '',
            nationalityCode: '',
            phone: '',
            email: '',
            dateOfBirth: '',
            bvn: '',
          })
          setApiErrors({})
          onSaved()
        },
        onError: (err: any) => {
          const { fieldErrors, generalError } = parseApiError(err)
          if (Object.keys(fieldErrors).length > 0) {
            setApiErrors(fieldErrors)
          } else {
            toast({ title: generalError, severity: 'error' } as any)
          }
        },
      },
    )
  }

  function handleDelete(leadershipId: string) {
    if (!kycId) return
    deleteDirector.mutate(
      { kycId, leadershipId },
      {
        onSuccess: () => {
          toast({ title: 'Director removed', severity: 'success' } as any)
          onSaved()
        },
        onError: () => toast({ title: 'Failed to remove director.', severity: 'error' } as any),
      },
    )
  }

  return (
    <SectionCard
      title="Leadership & Directors"
      description="Key business directors or owners. Minimum of one required."
      isDone={directors.length > 0}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-5">
        {/* Added directors list */}
        {directors.length > 0 && (
          <div className="space-y-2">
            {directors.map((d: BusinessLeadership & { id?: string }) => (
              <div key={d.id ?? d.email} className="flex items-center justify-between gap-3 rounded-lg border border-border-primary-light px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-content-primary truncate">
                    {[d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ') || d.email}
                  </p>
                  <p className="text-xs text-content-tertiary capitalize">{d.role} · {d.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => d.id && handleDelete(d.id)}
                  disabled={deleteDirector.isPending}
                  className="p-1.5 rounded-lg text-content-tertiary hover:text-feedback-error-main hover:bg-feedback-error-light transition-colors disabled:opacity-40"
                  aria-label="Remove director"
                >
                  <Trash2 width={14} height={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add director form */}
        <form onSubmit={handleAdd} className="space-y-4 rounded-xl border border-dashed border-border-primary-light p-4">
          <p className="text-xs font-semibold text-content-secondary flex items-center gap-1.5">
            <Plus width={12} height={12} />
            Add a director
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>First name <span className="text-feedback-error-main">*</span></FieldLabel>
              <TextInput
                value={form.firstName}
                onChange={(e) => set('firstName', (e.target as HTMLInputElement).value)}
                placeholder="First name"
                aria-invalid={!!(errors.firstName || apiErrors.firstName)}
              />
              {(errors.firstName || apiErrors.firstName) && (
                <FieldError errors={[{ message: errors.firstName || apiErrors.firstName }]} />
              )}
            </Field>

            <Field>
              <FieldLabel>Last name <span className="text-feedback-error-main">*</span></FieldLabel>
              <TextInput
                value={form.lastName}
                onChange={(e) => set('lastName', (e.target as HTMLInputElement).value)}
                placeholder="Last name"
                aria-invalid={!!(errors.lastName || apiErrors.lastName)}
              />
              {(errors.lastName || apiErrors.lastName) && (
                <FieldError errors={[{ message: errors.lastName || apiErrors.lastName }]} />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Role <span className="text-feedback-error-main">*</span></FieldLabel>
              <SelectInput
                options={DIRECTOR_ROLES}
                value={form.role}
                onChange={(v) => set('role', v)}
                placeholder="Select role"
              />
              {(errors.role || apiErrors.role) && <FieldError errors={[{ message: errors.role || apiErrors.role }]} />}
            </Field>

            <Field>
              <FieldLabel>Nationality <span className="text-feedback-error-main">*</span></FieldLabel>
              <SelectInput
                options={NATIONALITY_OPTIONS}
                value={form.nationalityCode}
                onChange={(v) => set('nationalityCode', v)}
                placeholder="Select nationality"
                searchable
              />
              {(errors.nationalityCode || apiErrors.nationalityCode) && <FieldError errors={[{ message: errors.nationalityCode || apiErrors.nationalityCode }]} />}
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Phone <span className="text-feedback-error-main">*</span></FieldLabel>
              <PhoneInput
                value={form.phone}
                onChange={(v) => set('phone', v)}
                aria-invalid={!!(errors.phone || apiErrors.phone)}
              />
              {(errors.phone || apiErrors.phone) && <FieldError errors={[{ message: errors.phone || apiErrors.phone }]} />}
            </Field>

            <Field>
              <FieldLabel>Date of birth <span className="text-feedback-error-main">*</span></FieldLabel>
              <TextInput
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set('dateOfBirth', (e.target as HTMLInputElement).value)}
                aria-invalid={!!(errors.dateOfBirth || apiErrors.dateOfBirth)}
              />
              {(errors.dateOfBirth || apiErrors.dateOfBirth) && (
                <FieldError errors={[{ message: errors.dateOfBirth || apiErrors.dateOfBirth }]} />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Email address <span className="text-feedback-error-main">*</span></FieldLabel>
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => set('email', (e.target as HTMLInputElement).value)}
                placeholder="director@example.com"
                aria-invalid={!!(errors.email || apiErrors.email)}
              />
              {(errors.email || apiErrors.email) && <FieldError errors={[{ message: errors.email || apiErrors.email }]} />}
            </Field>

            <Field>
              <FieldLabel>BVN <span className="text-feedback-error-main">*</span></FieldLabel>
              <TextInput
                value={form.bvn}
                onChange={(e) => set('bvn', (e.target as HTMLInputElement).value)}
                placeholder="Bank verification number"
                aria-invalid={!!(errors.bvn || apiErrors.bvn)}
              />
              {(errors.bvn || apiErrors.bvn) && <FieldError errors={[{ message: errors.bvn || apiErrors.bvn }]} />}
            </Field>
          </div>

          <div className="flex justify-end">
            <Button type="submit" color="primary" size="sm" variant="outline" disabled={addDirector.isPending} loading={addDirector.isPending}>
              Add director
            </Button>
          </div>
        </form>

        {directors.length > 0 && (
          <div className="flex justify-end">
            <Button type="button" color="primary" size="sm" onClick={onToggle}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

// ─── Section 4: Documentation ─────────────────────────────────────────────────

function DocumentationSection({
  kyc,
  kycId,
  isExpanded,
  onToggle,
  onSaved,
}: {
  kyc: ApiHydratedBusinessKYC | undefined
  kycId: string
  isExpanded: boolean
  onToggle: () => void
  onSaved: () => void
}) {
  const existing = kyc?.documentation
  const [cacCert, setCacCert] = useState<{ file: File; name: string } | null>(null)
  const [applicationDoc, setApplicationDoc] = useState<{ file: File; name: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kycId || !cacCert?.file || !applicationDoc?.file) return
    setIsSubmitting(true)
    try {
      await submitKycDocumentation(kycId, cacCert.file, applicationDoc.file)
      toast({ title: 'Documents saved', severity: 'success' } as any)
      onSaved()
    } catch (err: any) {
      const { generalError } = parseApiError(err)
      toast({
        title: generalError ?? 'Failed to save documents. Please try again.',
        severity: 'error',
      } as any)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = cacCert?.file && applicationDoc?.file

  return (
    <SectionCard
      title="CAC Registration & Documentation"
      description="Company incorporation documents from the Corporate Affairs Commission"
      isDone={!!existing}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      {existing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border-primary-light px-4 py-3">
            <p className="text-sm text-content-primary">CAC Certificate</p>
            <a href={existing.cacCertificate?.url as string | undefined} target="_blank" rel="noopener noreferrer" className="text-xs text-action-primary-main hover:underline">View</a>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border-primary-light px-4 py-3">
            <p className="text-sm text-content-primary">Application Document</p>
            <a href={existing.applicationDoc?.url as string | undefined} target="_blank" rel="noopener noreferrer" className="text-xs text-action-primary-main hover:underline">View</a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field>
            <FieldLabel>CAC Certificate <span className="text-feedback-error-main">*</span></FieldLabel>
            {cacCert ? (
              <div className="flex items-center justify-between rounded-lg border border-border-primary-light px-4 py-3">
                <p className="text-sm text-content-primary truncate">{cacCert.name}</p>
                <button
                  type="button"
                  onClick={() => setCacCert(null)}
                  className="p-1.5 rounded-lg text-content-tertiary hover:text-feedback-error-main hover:bg-feedback-error-light transition-colors shrink-0"
                  aria-label="Remove file"
                >
                  <Trash2 width={14} height={14} />
                </button>
              </div>
            ) : (
              <FileUpload
                onFileUpload={({ file }, cb) => {
                  setCacCert({ file, name: file.name })
                  cb({ progress: 100, status: 'upload_success' })
                }}
                onFileRemove={() => setCacCert(null)}
                maxFiles={1}
                maxFileSize={5 * 1024 * 1024}
                acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
                size="large"
                dropZoneLabel="Upload CAC certificate"
                dropZoneDescription="Company registration certificate issued by the CAC · PNG, JPG or PDF (max 5MB)"
              />
            )}
          </Field>

          <Field>
            <FieldLabel>Form CO7 / Application Document <span className="text-feedback-error-main">*</span></FieldLabel>
            {applicationDoc ? (
              <div className="flex items-center justify-between rounded-lg border border-border-primary-light px-4 py-3">
                <p className="text-sm text-content-primary truncate">{applicationDoc.name}</p>
                <button
                  type="button"
                  onClick={() => setApplicationDoc(null)}
                  className="p-1.5 rounded-lg text-content-tertiary hover:text-feedback-error-main hover:bg-feedback-error-light transition-colors shrink-0"
                  aria-label="Remove file"
                >
                  <Trash2 width={14} height={14} />
                </button>
              </div>
            ) : (
              <FileUpload
                onFileUpload={({ file }, cb) => {
                  setApplicationDoc({ file, name: file.name })
                  cb({ progress: 100, status: 'upload_success' })
                }}
                onFileRemove={() => setApplicationDoc(null)}
                maxFiles={1}
                maxFileSize={5 * 1024 * 1024}
                acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
                size="large"
                dropZoneLabel="Upload CO7 or Application for Registration"
                dropZoneDescription="CO7 (pre-2020) or Application for Registration (post-2020) · PNG, JPG or PDF (max 5MB)"
              />
            )}
          </Field>

          <div className="flex justify-end pt-2">
            <Button type="submit" color="primary" size="sm" disabled={!canSubmit || isSubmitting} loading={isSubmitting}>
              Save & continue
            </Button>
          </div>
        </form>
      )}
    </SectionCard>
  )
}

// ─── Submit section ───────────────────────────────────────────────────────────

function SubmitSection({
  kyc,
  kycId,
  allDone,
  onSubmitted,
}: {
  kyc: ApiHydratedBusinessKYC | undefined
  kycId: string
  allDone: boolean
  onSubmitted: () => void
}) {
  const submitKyc = useBusinessKYCControllerSubmitKyc()

  if (kyc?.approvalRequestedAt) {
    return (
      <div className="rounded-xl border border-feedback-success-border bg-feedback-success-light px-5 py-4 flex items-center gap-4">
        <CheckCircle className="text-feedback-success-main shrink-0" width={18} height={18} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-feedback-success-dark">Under review</p>
          <p className="text-xs text-feedback-success-dark opacity-75 mt-0.5">
            We&apos;re reviewing your submitted information. You&apos;ll be notified once approved.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={[
      'rounded-xl border px-5 py-4 flex items-center justify-between gap-4 transition-colors',
       'border-border-primary-light bg-surface-secondary',
    ].join(' ')}>
      <div className="min-w-0">
        <p className={['text-sm font-semibold', allDone ? 'text-content-primary' : 'text-content-tertiary'].join(' ')}>
          Submit for review
        </p>
        <p className="text-xs text-content-tertiary mt-0.5">
          {allDone
            ? 'All sections complete — submit your information to unlock live mode.'
            : 'Complete all sections above to request approval.'}
        </p>
      </div>
      <Button
        color="primary"
        size="sm"
        disabled={!allDone || !kycId || submitKyc.isPending}
        loading={submitKyc.isPending}
        onClick={() =>
          submitKyc.mutate(
            { id: kycId },
            {
              onSuccess: () => {
                toast({ title: 'Approval request submitted', severity: 'success' } as any)
                onSubmitted()
              },
              onError: () => toast({ title: 'Submission failed. Please try again.', severity: 'error' } as any),
            },
          )
        }
      >
        Request approval
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function normalizeKyc(raw: Record<string, unknown> | undefined): ApiHydratedBusinessKYC | undefined {
  if (!raw) return undefined
  return {
    ...(raw as ApiHydratedBusinessKYC),
    information: (raw.information ?? raw.businessInformation) as ApiHydratedBusinessKYC['information'],
    address: (raw.address ?? raw.businessAddress) as ApiHydratedBusinessKYC['address'],
    directors: ((raw.directors as BusinessLeadership[] | undefined)?.length
      ? raw.directors
      : raw.leadership) as BusinessLeadership[] | undefined,
  }
}

export default function CompliancePage() {
  const queryClient = useQueryClient()
  const { data: bizData, isLoading: bizLoading } = useBusinessControllerFind(undefined)
  const business = ((bizData as { data?: { data?: { kyc?: string } } })?.data?.data ??
    (bizData as { data?: { kyc?: string } })?.data) as { kyc?: string } | undefined
  const kycId = business?.kyc ?? ''

  const { data: kycData, isLoading: kycLoading } = useBusinessKYCControllerGetKyc(kycId, {
    query: { enabled: !!kycId },
  })
  const raw = ((kycData as { data?: Record<string, unknown> })?.data ??
    (kycData as { data?: { data?: Record<string, unknown> } })?.data?.data) as
    | Record<string, unknown>
    | undefined
  const kyc = normalizeKyc(raw)
  const isLoading = bizLoading || (!!kycId && kycLoading)

  const infoDone = !!kyc?.information
  const addressDone = !!kyc?.address
  const directorsDone = (kyc?.directors?.length ?? 0) > 0
  const docsDone = !!kyc?.documentation
  const allDone = infoDone && addressDone && directorsDone && docsDone

  const [activeSection, setActiveSection] = useState<string | null>(null)
  const initialized = useRef(false)

  // Only auto-advance once — on initial data load. After that, explicit saves drive navigation.
  useEffect(() => {
    if (isLoading || initialized.current) return
    initialized.current = true
    if (!infoDone) setActiveSection('information')
    else if (!addressDone) setActiveSection('address')
    else if (!directorsDone) setActiveSection('directors')
    else if (!docsDone) setActiveSection('documentation')
  }, [isLoading, infoDone, addressDone, directorsDone, docsDone])

  function toggle(section: string) {
    setActiveSection((s) => (s === section ? null : section))
  }

  function handleSaved(nextSection?: string) {
    queryClient.invalidateQueries({ queryKey: getBusinessControllerFindQueryKey(undefined) })
    if (kycId) {
      queryClient.invalidateQueries({ queryKey: getBusinessKYCControllerGetKycQueryKey(kycId) })
    }
    if (nextSection) setActiveSection(nextSection)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="mb-2">
        <h1 className="text-base font-semibold text-content-primary">KYC Verification</h1>
        <p className="text-sm text-content-tertiary mt-0.5">
          Complete all sections to unlock live mode for your business.
        </p>
      </div>

      <BusinessInfoSection
        kyc={kyc}
        kycId={kycId || kyc?.id || ''}
        isExpanded={activeSection === 'information'}
        onToggle={() => toggle('information')}
        onSaved={() => handleSaved('address')}
      />

      <AddressSection
        kyc={kyc}
        kycId={kycId || kyc?.id || ''}
        isExpanded={activeSection === 'address'}
        onToggle={() => toggle('address')}
        onSaved={() => handleSaved('directors')}
      />

      <DirectorsSection
        kyc={kyc}
        kycId={kycId || kyc?.id || ''}
        isExpanded={activeSection === 'directors'}
        onToggle={() => toggle('directors')}
        onSaved={() => handleSaved(directorsDone ? undefined : 'documentation')}
      />

      <DocumentationSection
        kyc={kyc}
        kycId={kycId || kyc?.id || ''}
        isExpanded={activeSection === 'documentation'}
        onToggle={() => toggle('documentation')}
        onSaved={() => handleSaved()}
      />

      {!kyc?.completed && (
        <SubmitSection
          kyc={kyc}
          kycId={kycId || kyc?.id || ''}
          allDone={allDone}
          onSubmitted={() => {
            queryClient.invalidateQueries({ queryKey: getBusinessControllerFindQueryKey(undefined) })
            if (kycId) {
              queryClient.invalidateQueries({ queryKey: getBusinessKYCControllerGetKycQueryKey(kycId) })
            }
          }}
        />
      )}
    </div>
  )
}
