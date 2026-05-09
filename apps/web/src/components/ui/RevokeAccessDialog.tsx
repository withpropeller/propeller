'use client'

import {
  Button,
  ModalDialog,
  ModalDialogContent,
  ModalDialogHeader,
  ModalDialogTitle,
  ModalDialogDescription,
  ModalDialogFooter,
  ModalDialogClose,
} from '@/lib/pax'

interface Props {
  memberName: string
  memberEmail: string
  isPending?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function RevokeAccessDialog({ memberName, memberEmail, isPending, onClose, onConfirm }: Props) {
  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent className="max-w-md">
        <ModalDialogHeader>
          <ModalDialogTitle>Revoke access</ModalDialogTitle>
          <ModalDialogDescription>
            {memberName} ({memberEmail}) will lose access to this dashboard immediately. They'll need a new invitation to rejoin.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <ModalDialogFooter>
          <ModalDialogClose asChild>
            <Button variant="outline" color="secondary" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
          </ModalDialogClose>
          <Button color="danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Revoking…' : 'Revoke access'}
          </Button>
        </ModalDialogFooter>
      </ModalDialogContent>
    </ModalDialog>
  )
}
