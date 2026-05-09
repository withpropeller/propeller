'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/lib/pax'
import { Check, XCircle, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
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
      onError: (err: any) => {
        setErrorMessage(err?.message ?? 'Something went wrong. Please try again.')
        setStatus('error')
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface-secondary">
        <div className="w-full max-w-md text-center">
          <Loader2 className="mx-auto mb-6 text-action-primary-main animate-spin" size={40} />
          <h2 className="text-xl font-semibold text-content-primary mb-2">Confirming your email…</h2>
          <p className="text-sm text-content-tertiary">Just a moment while we verify your account.</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface-secondary">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-feedback-success-light rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-feedback-success-main" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-content-primary mb-3">Email confirmed</h2>
          <p className="text-content-tertiary mb-8 leading-relaxed">
            Your email has been verified. You can now sign in to your account.
          </p>
          <Link href="/auth/login">
            <Button variant="default" className="w-full">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface-secondary">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-feedback-danger-light rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-feedback-danger-main" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-content-primary mb-3">Invalid link</h2>
          <p className="text-content-tertiary mb-8 leading-relaxed">
            This confirmation link is missing required information. Please use the link from your confirmation email.
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">Back to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface-secondary">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-feedback-danger-light rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-feedback-danger-main" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-content-primary mb-3">Confirmation failed</h2>
        <p className="text-content-tertiary mb-8 leading-relaxed">{errorMessage}</p>
        <p className="text-sm text-content-tertiary mb-6">
          Confirmation links expire after a short time. Sign in and request a new one.
        </p>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full">Back to Login</Button>
        </Link>
      </div>
    </div>
  )
}
