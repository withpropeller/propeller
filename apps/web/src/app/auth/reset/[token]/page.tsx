'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { Alert, Button, Label, PasswordInput } from '@/components/propeller'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { useResetPassword } from '@/hooks/useAuth'
import { API_STATUS } from '@/lib/constants'
import { getAuthErrorMessage } from '@/lib/format'

export default function ResetPasswordPage() {
  const params = useParams()
  const token = (params?.token as string) ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)

  const resetMutation = useResetPassword()

  const mismatched = confirm.length > 0 && confirm !== password
  const valid = password.length >= 8 && !mismatched

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetMutation.mutate(
      { token, newPassword: password },
      {
        onSuccess: (res) => {
          if (res.code === API_STATUS.SUCCESS || !res.code) setDone(true)
        },
      },
    )
  }

  const responseError =
    resetMutation.data && resetMutation.data.code !== API_STATUS.SUCCESS
      ? resetMutation.data.message ?? 'Reset failed. Please try again.'
      : null
  const errorMessage = getAuthErrorMessage(resetMutation.error) ?? responseError

  if (done) {
    return (
      <AuthShell altAction={null}>
        <div className="text-center">
          <div className="size-14 bg-[#EAF9EF] border border-[#ACEBC0] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-[#17B04A]" size={26} />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
            All set
          </p>
          <h1 className="text-[28px] leading-[1.1] tracking-tight text-warm-text font-normal mb-4">
            Password reset
          </h1>
          <p className="text-[15px] text-warm-muted mb-8 leading-relaxed">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link href="/auth/login" className="block">
            <Button size="lg" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
          New password
        </p>
        <h1 className="text-[32px] leading-[1.1] tracking-tight text-warm-text font-normal mb-3">
          Choose something secure
        </h1>
        <p className="text-[15px] text-warm-muted leading-relaxed">
          At least 8 characters. Use a mix of letters, numbers, and symbols.
        </p>
      </div>

      {errorMessage && (
        <Alert severity="danger" title="Reset failed" className="mb-5">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
          <PasswordStrength password={password} className="mt-3" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            error={mismatched}
          />
          {mismatched && (
            <p className="mt-1.5 text-xs text-[#CE2121]">Passwords don&rsquo;t match.</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2"
          disabled={!valid}
          loading={resetMutation.isPending}
        >
          Reset password
        </Button>
      </form>
    </AuthShell>
  )
}
