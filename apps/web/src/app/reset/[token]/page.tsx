'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button, Alert, AlertDescription, AlertTitle } from '@/lib/pax'
import { Check } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
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
      }
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
          <div className="w-14 h-14 bg-feedback-success-light rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-feedback-success-main" size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-content-primary mb-3">
            Password reset
          </h1>
          <p className="text-sm text-content-secondary mb-8 leading-relaxed">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Button asChild variant="default" className="w-full">
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-content-primary leading-tight">
          Create a new password
          <br />
          Choose something secure
        </h1>
      </div>

      {errorMessage && (
        <Alert severity="danger" className="mb-6">
          <AlertTitle>Reset failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-content-primary mb-1.5"
          >
            New password
          </label>
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

        <div>
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-content-primary mb-1.5"
          >
            Confirm password
          </label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            aria-invalid={mismatched || undefined}
          />
          {mismatched && (
            <p className="mt-2 text-xs text-feedback-danger-main">
              Passwords don't match.
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full mt-2"
          disabled={resetMutation.isPending || !valid}
          loading={resetMutation.isPending}
        >
          Reset password
        </Button>
      </form>
    </AuthShell>
  )
}
