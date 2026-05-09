'use client'

import {
  Button,
  Field,
  FieldLabel,
  TextInput,
  ModalDialog,
  ModalDialogContent,
  ModalDialogHeader,
  ModalDialogTitle,
  ModalDialogDescription,
  ModalDialogBody,
  ModalDialogFooter,
  ModalDialogClose,
} from '@/lib/pax'

interface SafetokenModalProps {
  onClose: () => void
  onSubmit: () => void
  email: string
  onEmailChange: (v: string) => void
  phone: string
  onPhoneChange: (v: string) => void
  loading: boolean
}

export function SafetokenModal({
  onClose,
  onSubmit,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  loading,
}: SafetokenModalProps) {
  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Enrol Safetoken</ModalDialogTitle>
          <ModalDialogDescription>
            Set up 3D Secure OTP authentication for this card.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <ModalDialogBody className="space-y-4">
          <Field>
            <FieldLabel>Email address</FieldLabel>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => onEmailChange((e.target as HTMLInputElement).value)}
              placeholder="Customer email address"
              className="w-full"
            />
          </Field>
          <Field>
            <FieldLabel>Phone number</FieldLabel>
            <TextInput
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange((e.target as HTMLInputElement).value)}
              placeholder="e.g. +2348012345678"
              className="w-full"
            />
          </Field>
        </ModalDialogBody>

        <ModalDialogFooter>
          <ModalDialogClose asChild>
            <Button variant="outline" color="secondary" className="cursor-pointer">
              Cancel
            </Button>
          </ModalDialogClose>
          <Button
            color="primary"
            loading={loading}
            onClick={onSubmit}
            className="cursor-pointer"
          >
            Enrol on Safetoken
          </Button>
        </ModalDialogFooter>
      </ModalDialogContent>
    </ModalDialog>
  )
}
