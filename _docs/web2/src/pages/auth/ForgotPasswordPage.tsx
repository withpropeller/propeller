import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TextInput, Button, Alert, AlertDescription, AlertTitle } from '@/lib/pax'
import { Mail } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { useForgotPassword } from '@/hooks/useAuth'
import { getAuthErrorMessage } from '@/lib/format'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const forgotMutation = useForgotPassword()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    forgotMutation.mutate(
      { email },
      { onSuccess: () => setSent(true) }
    )
  }

  const errorMessage = getAuthErrorMessage(forgotMutation.error)

  if (sent) {
    return (
      <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
        <div className="text-center">
          <div className="w-14 h-14 bg-feedback-information-light rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="text-feedback-information-main" size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-content-primary mb-3">
            Check your email
          </h1>
          <p className="text-sm text-content-secondary mb-8 leading-relaxed">
            If an account exists for{' '}
            <span className="font-medium text-content-primary">{email}</span>, you'll
            receive a link to reset your password in the next few minutes.
          </p>

          <Button
            variant="outline"
            color="secondary"
            className="w-full mb-4"
            onClick={() => forgotMutation.mutate({ email })}
            loading={forgotMutation.isPending}
          >
            Resend link
          </Button>

          <p className="text-sm text-content-secondary">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-medium link"
            >
              Go back
            </button>
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-content-primary leading-tight">
          Forgot your password?
          <br />
          We'll send you a reset link
        </h1>
      </div>

      {errorMessage && (
        <Alert severity="danger" className="mb-6">
          <AlertTitle>Couldn't send link</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-content-primary mb-1.5"
          >
            Email
          </label>
          <TextInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            autoComplete="email"
            required
          />
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full"
          loading={forgotMutation.isPending}
          disabled={forgotMutation.isPending}
        >
          Send reset link
        </Button>
      </form>

      <p className="text-center mt-6 text-sm text-content-secondary">
        Remember your password?{' '}
        <Link to="/auth/login" className="font-medium link">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
