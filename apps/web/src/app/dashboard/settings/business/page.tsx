'use client'

import { useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertSuccessIcon,
  AlertInformationIcon,
  AlertWarningIcon,
  AlertTitle,
  Button,
  Skeleton,
  TextInput,
  Textarea,
  Field,
  FieldLabel,
  FieldError,
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
import { DetailCell, SectionHeader } from '@/components/ui/DetailPage'
import { useBusinessControllerFind } from '@/api/business/business'
import {
  useBusinessKYCControllerGetKyc,
  useBusinessKYCControllerUpdateBusinessInfo,
  useBusinessKYCControllerUpdateBusinessAddress,
} from '@/api/business-kyc/business-kyc'
import {
  type ApiHydratedBusiness,
  type ApiHydratedBusinessKYC,
  type KYCBusinessInformationDto,
  type KYCBusinessAddressDto,
} from '@/api/model'
import { formatDate } from '@/lib/format'

// ── Empty value ─────────────────────────────────────────────────────────────
function Empty({ children }: { children: React.ReactNode }) {
  return <span className="text-content-tertiary font-normal">{children}</span>
}

// ── Edit icon button (matches card-program detail) ──────────────────────────
function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="w-8 h-8 rounded-lg border border-border-primary-light flex items-center justify-center text-content-tertiary hover:text-content-primary hover:border-border-primary-main transition-colors"
    >
      <Pencil width={14} height={14} />
    </button>
  )
}

// ── Section block (flat on page) ────────────────────────────────────────────
function SectionBlock({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string
  editLabel?: string
  onEdit?: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <SectionHeader
        title={title}
        action={onEdit ? <EditButton onClick={onEdit} label={editLabel ?? `Edit ${title}`} /> : undefined}
      />
      <div className="grid grid-cols-3 gap-x-8 gap-y-5">{children}</div>
    </div>
  )
}

// ── Verification status ─────────────────────────────────────────────────────
type VerificationState = 'verified' | 'in_review' | 'action_required'

function resolveVerificationState(
  business: ApiHydratedBusiness | undefined,
  kyc: ApiHydratedBusinessKYC | undefined,
): VerificationState {
  if (business?.status === 'approved' && kyc?.completed) return 'verified'
  if (business?.status === 'requested' || (kyc?.completed && business?.status !== 'approved')) {
    return 'in_review'
  }
  return 'action_required'
}

const STATE_CONFIG: Record<
  VerificationState,
  {
    severity: 'success' | 'information' | 'warning'
    icon: React.ComponentType
    title: string
    body: string
    cta?: { label: string; href: string }
  }
> = {
  verified: {
    severity: 'success',
    icon: AlertSuccessIcon,
    title: 'Business verified',
    body: 'Your business is active and able to issue cards.',
  },
  in_review: {
    severity: 'information',
    icon: AlertInformationIcon,
    title: 'Verification in review',
    body: "We're reviewing your documents. This usually takes 1–2 business days.",
  },
  action_required: {
    severity: 'warning',
    icon: AlertWarningIcon,
    title: 'Verification required',
    body: 'Complete your KYC to activate card issuing.',
    cta: { label: 'Complete KYC', href: '/dashboard/settings/compliance' },
  },
}

function VerificationStatusCard({ state }: { state: VerificationState }) {
  const config = STATE_CONFIG[state]
  const Icon = config.icon
  return (
    <Alert
      severity={config.severity}
      variant="muted"
      className="!grid-cols-[calc(var(--spacing)*10)_1fr] gap-x-4 items-center"
    >
      <div className="w-10 h-10 rounded-lg bg-current/10 flex items-center justify-center shrink-0 [&>svg]:size-5">
        <Icon />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <AlertTitle>{config.title}</AlertTitle>
          <AlertDescription>{config.body}</AlertDescription>
        </div>
        {config.cta && (
          <Button
            asChild
            size="sm"
            variant="outline"
            color="secondary"
            className="shrink-0 self-start sm:self-auto"
          >
            <Link href={config.cta.href}>{config.cta.label}</Link>
          </Button>
        )}
      </div>
    </Alert>
  )
}

// ── Edit: Business information ──────────────────────────────────────────────
// Covers every KYC information field in one place so the PUT /business/kyc/information
// write has the full DTO, regardless of which section the user clicked Edit on.
function EditInformationModal({
  current,
  onClose,
  onSaved,
}: {
  current: ApiHydratedBusinessKYC['information']
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<KYCBusinessInformationDto>({
    businessName: current?.businessName ?? '',
    registrationType: current?.registrationType ?? '',
    registrationNumber: current?.registrationNumber ?? '',
    businessDescription: current?.businessDescription ?? '',
    tin: current?.tin ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof KYCBusinessInformationDto, string>>>({})

  const { mutateAsync, isPending } = useBusinessKYCControllerUpdateBusinessInfo()

  function validate(): typeof errors {
    const e: typeof errors = {}
    if (!form.businessName.trim()) e.businessName = 'Registered name is required.'
    if (!form.registrationType.trim()) e.registrationType = 'Registration type is required.'
    if (!form.registrationNumber.trim()) e.registrationNumber = 'Registration number is required.'
    if (!form.businessDescription.trim()) e.businessDescription = 'A short description is required.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length > 0) {
      setErrors(v)
      return
    }
    try {
      await mutateAsync({ data: form } as any)
      toast({ title: 'Business information updated', severity: 'success' } as any)
      onSaved()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Failed to update',
        description: err?.response?.data?.message || err?.message || 'Something went wrong.',
        severity: 'danger',
      } as any)
    }
  }

  function update<K extends keyof KYCBusinessInformationDto>(
    key: K,
    val: KYCBusinessInformationDto[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Edit business information</ModalDialogTitle>
          <ModalDialogDescription>
            Update your registered business details.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-4">
            <Field>
              <FieldLabel htmlFor="businessName">Registered name</FieldLabel>
              <TextInput
                id="businessName"
                value={form.businessName}
                onChange={(e) => update('businessName', (e.target as HTMLInputElement).value)}
                placeholder="e.g. Paystack Payments Ltd"
              />
              {errors.businessName && <FieldError errors={[{ message: errors.businessName }]} />}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="registrationType">Registration type</FieldLabel>
                <TextInput
                  id="registrationType"
                  value={form.registrationType}
                  onChange={(e) => update('registrationType', (e.target as HTMLInputElement).value)}
                  placeholder="e.g. Limited Liability"
                />
                {errors.registrationType && (
                  <FieldError errors={[{ message: errors.registrationType }]} />
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="registrationNumber">Registration number (CAC)</FieldLabel>
                <TextInput
                  id="registrationNumber"
                  value={form.registrationNumber}
                  onChange={(e) =>
                    update('registrationNumber', (e.target as HTMLInputElement).value)
                  }
                  placeholder="Registration number"
                />
                {errors.registrationNumber && (
                  <FieldError errors={[{ message: errors.registrationNumber }]} />
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="tin">Tax ID (TIN)</FieldLabel>
              <TextInput
                id="tin"
                value={form.tin ?? ''}
                onChange={(e) => update('tin', (e.target as HTMLInputElement).value)}
                placeholder="Optional"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="businessDescription">Business description</FieldLabel>
              <Textarea
                id="businessDescription"
                value={form.businessDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  update('businessDescription', e.target.value)
                }
                placeholder="What does your business do?"
                rows={3}
              />
              {errors.businessDescription && (
                <FieldError errors={[{ message: errors.businessDescription }]} />
              )}
            </Field>
          </ModalDialogBody>

          <ModalDialogFooter className="pt-6">
            <ModalDialogClose asChild>
              <Button type="button" variant="outline" color="secondary">
                Cancel
              </Button>
            </ModalDialogClose>
            <Button type="submit" color="primary" loading={isPending} disabled={isPending}>
              Save changes
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}

// ── Edit: Registered address ────────────────────────────────────────────────
function EditAddressModal({
  current,
  onClose,
  onSaved,
}: {
  current: ApiHydratedBusinessKYC['address']
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<KYCBusinessAddressDto>({
    addressLineOne: current?.addressLineOne ?? '',
    addressLineTwo: current?.addressLineTwo ?? '',
    city: current?.city ?? '',
    state: current?.state ?? '',
    countryCode: current?.countryCode ?? '',
    phone: current?.phone ?? '',
    email: current?.email ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof KYCBusinessAddressDto, string>>>({})

  const { mutateAsync, isPending } = useBusinessKYCControllerUpdateBusinessAddress()

  function validate(): typeof errors {
    const e: typeof errors = {}
    if (!form.addressLineOne.trim()) e.addressLineOne = 'Address line 1 is required.'
    if (!form.city.trim()) e.city = 'City is required.'
    if (!form.state.trim()) e.state = 'State is required.'
    if (!form.countryCode.trim()) e.countryCode = 'Country is required.'
    if (!form.phone.trim()) e.phone = 'Phone is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Enter a valid email address.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length > 0) {
      setErrors(v)
      return
    }
    try {
      await mutateAsync({ data: form } as any)
      toast({ title: 'Address updated', severity: 'success' } as any)
      onSaved()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Failed to update',
        description: err?.response?.data?.message || err?.message || 'Something went wrong.',
        severity: 'danger',
      } as any)
    }
  }

  function update<K extends keyof KYCBusinessAddressDto>(key: K, val: KYCBusinessAddressDto[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Edit registered address</ModalDialogTitle>
          <ModalDialogDescription>
            Update the address on file for your business.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-4">
            <Field>
              <FieldLabel htmlFor="addressLineOne">Address line 1</FieldLabel>
              <TextInput
                id="addressLineOne"
                value={form.addressLineOne}
                onChange={(e) => update('addressLineOne', (e.target as HTMLInputElement).value)}
              />
              {errors.addressLineOne && (
                <FieldError errors={[{ message: errors.addressLineOne }]} />
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="addressLineTwo">Address line 2</FieldLabel>
              <TextInput
                id="addressLineTwo"
                value={form.addressLineTwo ?? ''}
                onChange={(e) => update('addressLineTwo', (e.target as HTMLInputElement).value)}
                placeholder="Optional"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <TextInput
                  id="city"
                  value={form.city}
                  onChange={(e) => update('city', (e.target as HTMLInputElement).value)}
                />
                {errors.city && <FieldError errors={[{ message: errors.city }]} />}
              </Field>
              <Field>
                <FieldLabel htmlFor="state">State</FieldLabel>
                <TextInput
                  id="state"
                  value={form.state}
                  onChange={(e) => update('state', (e.target as HTMLInputElement).value)}
                />
                {errors.state && <FieldError errors={[{ message: errors.state }]} />}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="countryCode">Country</FieldLabel>
              <TextInput
                id="countryCode"
                value={form.countryCode}
                onChange={(e) => update('countryCode', (e.target as HTMLInputElement).value)}
                placeholder="e.g. NG"
              />
              {errors.countryCode && <FieldError errors={[{ message: errors.countryCode }]} />}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <TextInput
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update('phone', (e.target as HTMLInputElement).value)}
                  placeholder="+234…"
                />
                {errors.phone && <FieldError errors={[{ message: errors.phone }]} />}
              </Field>
              <Field>
                <FieldLabel htmlFor="addressEmail">Email</FieldLabel>
                <TextInput
                  id="addressEmail"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', (e.target as HTMLInputElement).value)}
                  placeholder="business@example.com"
                />
                {errors.email && <FieldError errors={[{ message: errors.email }]} />}
              </Field>
            </div>
          </ModalDialogBody>

          <ModalDialogFooter className="pt-6">
            <ModalDialogClose asChild>
              <Button type="button" variant="outline" color="secondary">
                Cancel
              </Button>
            </ModalDialogClose>
            <Button type="submit" color="primary" loading={isPending} disabled={isPending}>
              Save changes
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function BusinessPage() {
  const { can } = usePermissions()
  const { data: bizData, isLoading: bizLoading } = useBusinessControllerFind()
  const {
    data: kycData,
    isLoading: kycLoading,
    refetch: refetchKyc,
  } = useBusinessKYCControllerGetKyc()

  const business = (bizData as any)?.data?.data as ApiHydratedBusiness | undefined
  const kyc = (kycData as any)?.data?.data as ApiHydratedBusinessKYC | undefined

  const [editOpen, setEditOpen] = useState<'information' | 'address' | null>(null)

  if (bizLoading || kycLoading) return <BusinessSkeleton />

  const state = resolveVerificationState(business, kyc)

  const addressLines = [kyc?.address?.addressLineOne, kyc?.address?.addressLineTwo]
    .filter(Boolean)
    .join(', ')
  const cityState = [kyc?.address?.city, kyc?.address?.state].filter(Boolean).join(', ')

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-content-primary leading-snug">
          Business Identity
        </h1>
        <p className="text-sm text-content-tertiary mt-1">
          A summary of your registered business.
        </p>
      </div>

      {/* ── Verification status (hero) ──────────────────────────────────── */}
      <VerificationStatusCard state={state} />

      {/* ── Business overview ───────────────────────────────────────────── */}
      <SectionBlock
        title="Business overview"
        editLabel="Edit business information"
        onEdit={() => setEditOpen('information')}
      >
        <DetailCell label="Business name">
          {business?.name || <Empty>Not provided</Empty>}
        </DetailCell>
        <DetailCell label="Business email">
          {business?.email || <Empty>Not provided</Empty>}
        </DetailCell>
        <DetailCell label="Registered name">
          {kyc?.information?.businessName || <Empty>Not provided</Empty>}
        </DetailCell>
        <DetailCell label="Registration type">
          {kyc?.information?.registrationType ? (
            <span className="capitalize">{kyc.information.registrationType}</span>
          ) : (
            <Empty>Not provided</Empty>
          )}
        </DetailCell>
        <DetailCell label="Business description">
          {kyc?.information?.businessDescription || <Empty>Not provided</Empty>}
        </DetailCell>
        <DetailCell label="Member since">
          {business?.createdAt ? formatDate(business.createdAt) : <Empty>Unknown</Empty>}
        </DetailCell>
      </SectionBlock>

      {/* ── Registration ────────────────────────────────────────────────── */}
      <SectionBlock
        title="Registration"
        editLabel="Edit registration"
        onEdit={can(Permission.BusinessKyc) ? () => setEditOpen('information') : undefined}
      >
        <DetailCell label="Registration number (CAC)">
          {kyc?.information?.registrationNumber || <Empty>Not provided</Empty>}
        </DetailCell>
        <DetailCell label="Tax ID (TIN)">
          {kyc?.information?.tin || <Empty>Not provided</Empty>}
        </DetailCell>
      </SectionBlock>

      {/* ── Registered address ──────────────────────────────────────────── */}
      <SectionBlock
        title="Registered address"
        editLabel="Edit registered address"
        onEdit={can(Permission.BusinessKyc) ? () => setEditOpen('address') : undefined}
      >
        <DetailCell label="Address">
          {addressLines || <Empty>Not provided</Empty>}
        </DetailCell>
        <DetailCell label="City / State">
          {cityState || <Empty>Not provided</Empty>}
        </DetailCell>
        <DetailCell label="Country">
          {kyc?.address?.countryCode || <Empty>Not provided</Empty>}
        </DetailCell>
        <DetailCell label="Phone">
          {kyc?.address?.phone || <Empty>Not provided</Empty>}
        </DetailCell>
        <DetailCell label="Email">
          {kyc?.address?.email || <Empty>Not provided</Empty>}
        </DetailCell>
      </SectionBlock>

      {editOpen === 'information' && (
        <EditInformationModal
          current={kyc?.information}
          onClose={() => setEditOpen(null)}
          onSaved={() => refetchKyc()}
        />
      )}
      {editOpen === 'address' && (
        <EditAddressModal
          current={kyc?.address}
          onClose={() => setEditOpen(null)}
          onSaved={() => refetchKyc()}
        />
      )}
    </div>
  )
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function BusinessSkeleton() {
  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-[88px] rounded-xl" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
