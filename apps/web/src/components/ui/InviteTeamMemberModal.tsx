'use client'

import { useState } from 'react'
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
import { useBusinessControllerCreate } from '@/api/business/business'

const ROLE_OPTIONS = [
  { value: 'admin',     label: 'Admin',     description: 'Full access' },
  { value: 'developer', label: 'Developer', description: 'API & technical access' },
  { value: 'support', label: 'Support', description: 'Support Access'},

]

interface FormErrors {
  email?: string
  role?: string
}

interface Props {
  onClose: () => void
  onInvited: () => void
}

export function InviteTeamMemberModal({ onClose, onInvited }: Props) {
  const [email, setEmail] = useState('')
  const [role,  setRole]  = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const { mutate, isPending } = useBusinessControllerCreate()

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!email.trim()) errs.email = 'Enter an email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.'
    if (!role) errs.role = 'Select a role.'
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    mutate(
      { data: { email: email.trim(), roles: [role] } },
      {
        onSuccess: () => {
          toast({
            title: 'Invitation sent',
            description: `An invite was sent to ${email.trim()}.`,
            severity: 'success',
          } as any)
          onInvited()
          onClose()
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.message || 'Something went wrong.'
          toast({ title: 'Failed to send invitation', description: message, severity: 'danger' } as any)
        },
      },
    )
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent className="max-w-md">
        <ModalDialogHeader>
          <ModalDialogTitle>Invite team member</ModalDialogTitle>
          <ModalDialogDescription>
            They'll receive an email invitation to join your team.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <ModalDialogBody className="space-y-4">
          <Field>
            <FieldLabel>Email address <span className="text-red-500">*</span></FieldLabel>
            <TextInput
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => {
                setEmail((e.target as HTMLInputElement).value)
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
              }}
            />
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Role <span className="text-red-500">*</span></FieldLabel>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v)
                if (errors.role) setErrors((p) => ({ ...p, role: undefined }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-content-tertiary"> — {opt.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <FieldError>{errors.role}</FieldError>}
          </Field>
        </ModalDialogBody>

        <ModalDialogFooter>
          <ModalDialogClose asChild>
            <Button variant="outline" color="secondary" onClick={onClose}>
              Cancel
            </Button>
          </ModalDialogClose>
          <Button color="primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Sending…' : 'Send invite'}
          </Button>
        </ModalDialogFooter>
      </ModalDialogContent>
    </ModalDialog>
  )
}
