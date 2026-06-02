'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import {
  Button,
  Skeleton,
  TextInput,
  Field,
  FieldLabel,
  FieldDescription,
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
import { useProfileControllerGet, useProfileControllerUpdateProfile } from '@/api/me/me'
import type { ApiHydratedUser } from '@/api/model'
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

// ── Edit: Personal information ──────────────────────────────────────────────
type EditForm = { firstName: string; lastName: string; phone: string }
type EditErrors = Partial<Record<keyof EditForm, string>>

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: ApiHydratedUser
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<EditForm>({
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    phone: profile.phone ?? '',
  })
  const [errors, setErrors] = useState<EditErrors>({})

  const { mutateAsync, isPending } = useProfileControllerUpdateProfile()

  function validate(): EditErrors {
    const e: EditErrors = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
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
      await mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone.trim() || undefined,
        preferences: profile.preferences ?? {},
      } as any)
      toast({ title: 'Profile updated', severity: 'success' } as any)
      onSaved()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Failed to update profile',
        description: err?.response?.data?.message || err?.message || 'Something went wrong.',
        severity: 'danger',
      } as any)
    }
  }

  function update<K extends keyof EditForm>(key: K, val: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Edit personal information</ModalDialogTitle>
          <ModalDialogDescription>
            Update your name and contact details.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">First name</FieldLabel>
                <TextInput
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => update('firstName', (e.target as HTMLInputElement).value)}
                />
                {errors.firstName && <FieldError errors={[{ message: errors.firstName }]} />}
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                <TextInput
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => update('lastName', (e.target as HTMLInputElement).value)}
                />
                {errors.lastName && <FieldError errors={[{ message: errors.lastName }]} />}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <TextInput
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', (e.target as HTMLInputElement).value)}
                placeholder="+234…"
              />
              <FieldDescription>Optional.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <TextInput
                id="email"
                value={profile.email}
                readOnly
                className="bg-surface-secondary text-content-tertiary cursor-not-allowed"
              />
              <FieldDescription>Contact support to change.</FieldDescription>
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

// ── Page ────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data, isLoading, refetch } = useProfileControllerGet()
  // Response shape can differ between endpoints (single vs double-wrapped).
  // Try both so the hydrated user is reached in either case.
  const profile =
    (((data as any)?.data?.data as ApiHydratedUser | undefined) ??
      ((data as any)?.data as ApiHydratedUser | undefined))

  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) return <ProfileSkeleton />

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-content-primary leading-snug">Profile</h1>
        <p className="text-sm text-content-tertiary mt-1">
          Your personal account information.
        </p>
      </div>

      {/* ── Personal information ────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Personal information"
          action={
            profile ? (
              <EditButton
                onClick={() => setEditOpen(true)}
                label="Edit personal information"
              />
            ) : undefined
          }
        />
        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
          <DetailCell label="First name">
            {profile?.firstName || <Empty>Not provided</Empty>}
          </DetailCell>
          <DetailCell label="Last name">
            {profile?.lastName || <Empty>Not provided</Empty>}
          </DetailCell>
          <DetailCell label="Phone">
            {profile?.phone || <Empty>Not provided</Empty>}
          </DetailCell>
          <DetailCell label="Email">
            {profile?.email || <Empty>Not provided</Empty>}
          </DetailCell>
          <DetailCell label="Member since">
            {profile?.createdAt ? formatDate(profile.createdAt) : <Empty>Unknown</Empty>}
          </DetailCell>
        </div>
      </div>

      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
