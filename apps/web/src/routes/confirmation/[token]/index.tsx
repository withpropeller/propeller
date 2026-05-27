'use client'

import { useEffect, useState } from 'react'
import { useParams } from '@/lib/routing'
import Link from '@/lib/routing'
import { Check, XCircle, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/propeller'
import { AuthShell } from '@/components/auth/AuthShell'
import { customInstance } from '@/lib/orvalClient'

type Status = 'loading' | 'success' | 'error' | 'invalid'

export default function ConfirmEmailPage() {
  const params = useParams()
  const token = params?.token as string | undefined

  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string>()

  const confirmMutation = useMutation({
    mutationFn: (stateToken: string) =>
      customInstance('/auth/confirm/email', {
        method: 'POST',
        body: JSON.stringify({ stateToken }),
      }),
  })

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    confirmMutation.mutate(token, {
      onSuccess: () => setStatus('success'),
      onError: (err: Error) => {
        setErrorMessage(err?.message ?? 'Something went wrong. Please try again.')
        setStatus('error')
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'loading') {
    return (
      <AuthShell altAction={null}>
        <div className="text-center">
          <Loader2 className="mx-auto mb-6 text-propeller-blue animate-spin" size={36} />
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
            Verifying
          </p>
          <h1 className="text-[28px] leading-[1.1] tracking-tight text-warm-text font-normal mb-3">
            Confirming your email…
          </h1>
          <p className="text-[15px] text-warm-muted leading-relaxed">
            Just a moment while we verify your account.
          </p>
        </div>
      </AuthShell>
    )
  }

  if (status === 'success') {
    return (
      <AuthShell altAction={null}>
        <div className="text-center">
          <div className="size-16 bg-[#EAF9EF] border border-[#ACEBC0] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-[#17B04A]" size={28} />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
            All set
          </p>
          <h1 className="text-[28px] leading-[1.1] tracking-tight text-warm-text font-normal mb-4">
            Email confirmed
          </h1>
          <p className="text-[15px] text-warm-muted mb-8 leading-relaxed">
            Your email has been verified. You can now sign in to your account.
          </p>
          <Link href="/auth/login" className="block">
            <Button size="lg" className="w-full">
              Go to sign in
            </Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  const isInvalid = status === 'invalid'
  return (
    <AuthShell altAction={null}>
      <div className="text-center">
        <div className="size-16 bg-[#FDEDED] border border-[#F4B3B3] rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-[#CE2121]" size={28} />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
          {isInvalid ? 'Invalid link' : 'Failed'}
        </p>
        <h1 className="text-[28px] leading-[1.1] tracking-tight text-warm-text font-normal mb-4">
          {isInvalid ? 'This link can’t be used' : 'Confirmation failed'}
        </h1>
        <p className="text-[15px] text-warm-muted mb-3 leading-relaxed">
          {isInvalid
            ? 'This confirmation link is missing required information. Please use the link from your confirmation email.'
            : errorMessage}
        </p>
        {!isInvalid && (
          <p className="text-sm text-warm-light mb-8">
            Confirmation links expire after a short time. Sign in and request a new one.
          </p>
        )}
        <Link href="/auth/login" className="block mt-6">
          <Button variant="secondary" size="lg" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    </AuthShell>
  )
}
