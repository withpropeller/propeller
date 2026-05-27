'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/lib/routing'
import Link from '@/lib/routing'
import { ArrowRight } from 'lucide-react'
import { Alert, Button, Checkbox, Input, Label, PasswordInput } from '@/components/propeller'
import { AuthShell } from '@/components/auth/AuthShell'
import { useLogin } from '@/hooks/useAuth'
import { useResendConfirmation } from '@/hooks/useSignup'
import { API_STATUS } from '@/lib/constants'
import { getAuthErrorMessage } from '@/lib/format'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [resendSent, setResendSent] = useState(false)

  const router = useRouter()
  const loginMutation = useLogin()
  const resendMutation = useResendConfirmation()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (res) => {
          if (res.code === API_STATUS.MFA_REQUIRED && res.data) {
            const searchParams = new URLSearchParams({
              email,
              stateToken: (res.data as { stateToken?: string }).stateToken ?? '',
            })
            router.push(`/auth/mfa?${searchParams.toString()}`)
          } else if (res.code === API_STATUS.SUCCESS) {
            router.push('/')
          }
        },
      },
    )
  }

  const { isPending: processing, error: mutationError } = loginMutation
  const loginData = loginMutation.data as { code?: string; message?: string } | undefined
  const isPending =
    (mutationError as { code?: string } | null)?.code === API_STATUS.PENDING ||
    loginData?.code === API_STATUS.PENDING
  const bodyError =
    loginData &&
    !isPending &&
    loginData.code !== API_STATUS.SUCCESS &&
    loginData.code !== API_STATUS.MFA_REQUIRED
      ? loginData.message || 'Login failed. Please try again.'
      : null
  const errorMessage = isPending ? null : getAuthErrorMessage(mutationError) ?? bodyError

  useEffect(() => {
    if (isPending && !resendSent) {
      resendMutation.mutate({ email }, { onSuccess: () => setResendSent(true) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending])

  function handleResend() {
    resendMutation.mutate({ email }, { onSuccess: () => setResendSent(true) })
  }

  return (
    <AuthShell altAction={{ label: 'Create account', href: '/signup' }}>
      <div className="mb-8">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Sign in
        </span>
        <h1 className="mt-2 mb-2 text-[36px] leading-[1.08] font-semibold tracking-[-0.025em] text-propeller-navy">
          Welcome back.
        </h1>
        <p className="text-[15px] text-ink-soft leading-[1.5]">
          Sign in to your Propeller dashboard to manage payments, payouts, and reconciliation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        {isPending && (
          <Alert severity="warning" title="Confirm your email">
            Check your inbox to verify before signing in.{' '}
            {resendSent ? (
              <span className="font-medium">Confirmation email sent.</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendMutation.isPending}
                className="font-semibold underline underline-offset-2 disabled:opacity-50"
              >
                {resendMutation.isPending ? 'Sending…' : 'Resend email'}
              </button>
            )}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="danger" title="Login failed">
            {errorMessage}
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/auth/reset"
              className="text-[12px] font-medium text-propeller-blue no-underline hover:underline whitespace-nowrap"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <label className="flex items-start gap-2.5 mt-1 cursor-pointer select-none">
          <Checkbox
            checked={remember}
            onCheckedChange={setRemember}
            aria-label="Keep me signed in"
          />
          <span className="text-[13px] text-ink leading-[1.5] whitespace-nowrap">
            Keep me signed in
          </span>
        </label>

        <Button
          type="submit"
          block
          className="mt-2"
          disabled={!email || !password}
          loading={processing}
          iconRight={<ArrowRight size={14} strokeWidth={2.2} />}
        >
          Sign in
        </Button>

        <div className="mt-4 text-center text-[14px] text-ink-soft">
          New to Propeller?{' '}
          <Link
            href="/signup"
            className="text-propeller-blue font-semibold no-underline hover:underline"
          >
            Create an account
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
