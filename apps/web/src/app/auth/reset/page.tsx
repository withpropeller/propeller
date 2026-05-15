'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import { Button, Input, Label } from '@/components/propeller'
import { AuthShell } from '@/components/auth/AuthShell'
import { useForgotPassword } from '@/hooks/useAuth'
import { getAuthErrorMessage } from '@/lib/format'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const forgotMutation = useForgotPassword()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    forgotMutation.mutate({ email }, { onSuccess: () => setSent(true) })
  }

  const errorMessage = getAuthErrorMessage(forgotMutation.error)

  if (sent) {
    return (
      <AuthShell altAction={null}>
        <div className="flex flex-col items-start">
          <div className="size-14 rounded-full bg-propeller-blue-tint text-propeller-blue flex items-center justify-center mb-6">
            <Mail size={26} />
          </div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Almost done
          </span>
          <h1 className="mt-2 mb-3 text-[36px] leading-[1.08] font-semibold tracking-[-0.025em] text-propeller-navy">
            Check your email.
          </h1>
          <p className="text-[15px] text-ink-soft leading-[1.55] mb-2">
            We sent a confirmation link to:
          </p>
          <div className="text-[15px] text-ink mb-7">
            <span className="font-semibold">{email}</span>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              variant="secondary"
              onClick={() => router.push('/auth/login')}
              iconLeft={<ArrowLeft size={14} strokeWidth={2.2} />}
            >
              Back to sign in
            </Button>
            <Button
              onClick={() => forgotMutation.mutate({ email })}
              loading={forgotMutation.isPending}
            >
              Resend link
            </Button>
          </div>

          <div className="text-[13px] text-ink-soft">
            Didn&rsquo;t get it? Check your spam folder, or{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-propeller-blue font-medium no-underline hover:underline"
            >
              use a different email
            </button>
            .
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
      <div className="mb-7">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Account recovery
        </span>
        <h1 className="mt-2 mb-2 text-[36px] leading-[1.08] font-semibold tracking-[-0.025em] text-propeller-navy">
          Reset your password.
        </h1>
        <p className="text-[15px] text-ink-soft leading-[1.5]">
          Enter the email on your account. We&rsquo;ll send you a link to set a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            required
          />
          {errorMessage && (
            <p className="text-[12px] text-propeller-coral">{errorMessage}</p>
          )}
        </div>

        <Button
          type="submit"
          block
          className="mt-1"
          disabled={!email}
          loading={forgotMutation.isPending}
          iconRight={<ArrowRight size={14} strokeWidth={2.2} />}
        >
          Send reset link
        </Button>

        <div className="mt-1 text-center text-[14px] text-ink-soft">
          <Link
            href="/auth/login"
            className="text-propeller-blue font-semibold no-underline hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
