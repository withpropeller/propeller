import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TextInput,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
  Checkbox,
} from '@/lib/pax'
import { Check } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { useSignup, useResendConfirmation } from '@/hooks/useSignup'

const TOTAL_STEPS = 2

const registeredOptions = [
  {
    value: 'RC',
    label: 'Registered Company (RC)',
    description: 'Registered with the CAC as a limited liability company.',
  },
  {
    value: 'BN',
    label: 'Business Name (BN)',
    description: 'Enterprise or sole proprietorship registered with the CAC.',
  },
] as const

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [signupDone, setSignupDone] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    businessWebsite: '',
    businessRegStatus: 'RC',
    termsAccepted: false,
  })

  const signupMutation = useSignup()
  const resendMutation = useResendConfirmation()

  const fieldErrors = (signupMutation.error as any)?.errors as
    | { property: string; error: string }[]
    | undefined
  const getFieldError = (property: string) =>
    fieldErrors?.find((e) => e.property === property)?.error

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, termsAccepted: checked }))
  }

  const nextStep = () => setStep((prev) => prev + 1)
  const prevStep = () => setStep((prev) => prev - 1)

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    signupMutation.mutate(formData, {
      onSuccess: () => setSignupDone(true),
    })
  }

  if (signupDone) {
    return (
      <AuthShell altAction={null}>
        <div className="text-center">
          <div className="w-14 h-14 bg-feedback-success-light rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-feedback-success-main" size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-content-primary mb-3">
            Check your email
          </h1>
          <p className="text-sm text-content-secondary mb-8 leading-relaxed">
            We've sent a confirmation link to{' '}
            <span className="font-medium text-content-primary">{formData.email}</span>.
            Click the link to verify your email and access your dashboard.
          </p>

          <Button
            variant="outline"
            color="secondary"
            className="w-full mb-4"
            onClick={() => resendMutation.mutate({ email: formData.email })}
            loading={resendMutation.isPending}
          >
            Resend confirmation email
          </Button>

          <p className="text-sm text-content-secondary">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => setSignupDone(false)}
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
        {step === 1 ? (
          <h1 className="text-2xl font-semibold text-content-primary leading-tight">
            Create your account
            <br />
            Let's start with the basics
          </h1>
        ) : (
          <h1 className="text-2xl font-semibold text-content-primary leading-tight">
            Tell us about your
            <br />
            business
          </h1>
        )}
      </div>

      <div
        className="h-1 w-full bg-surface-tertiary rounded-full mb-8 overflow-hidden"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step}
        aria-label={`Step ${step} of ${TOTAL_STEPS}`}
      >
        <div
          className="h-full bg-action-primary-main transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {signupMutation.isError && (
        <Alert severity="danger" className="mb-6">
          <AlertTitle>Signup failed</AlertTitle>
          <AlertDescription>
            {fieldErrors?.length ? (
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                {fieldErrors.map((e) => (
                  <li key={e.property}>{e.error}</li>
                ))}
              </ul>
            ) : (
              (signupMutation.error as any)?.message ?? 'Please try again.'
            )}
          </AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            nextStep()
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-content-primary mb-1.5"
              >
                First name
              </label>
              <TextInput
                id="firstName"
                placeholder="Anjola"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                error={getFieldError('firstName')}
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-content-primary mb-1.5"
              >
                Last name
              </label>
              <TextInput
                id="lastName"
                placeholder="Adeyemi"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                error={getFieldError('lastName')}
              />
            </div>
          </div>

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
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              required
              error={getFieldError('email')}
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-content-primary mb-1.5"
            >
              Phone number
            </label>
            <PhoneInput
              id="phone"
              value={formData.phone}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, phone: value }))
              }
              error={getFieldError('phone')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-content-primary mb-1.5"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="new-password"
              required
              error={getFieldError('password')}
            />
            {formData.password && (
              <PasswordStrength password={formData.password} />
            )}
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={
              !formData.firstName ||
              !formData.lastName ||
              !formData.email ||
              !formData.phone ||
              formData.password.length < 8
            }
          >
            Continue
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content-primary mb-3">
              Business registration status
            </label>
            <div className="space-y-2">
              {registeredOptions.map((opt) => {
                const selected = formData.businessRegStatus === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        businessRegStatus: opt.value,
                      }))
                    }
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selected
                        ? 'border-action-primary-main bg-action-primary-subtle'
                        : 'border-border-primary-main bg-surface-primary hover:border-border-secondary-main'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selected
                            ? 'bg-action-primary-main'
                            : 'border border-border-tertiary-main'
                        }`}
                      >
                        {selected && (
                          <Check size={10} className="text-white" strokeWidth={3} />
                        )}
                      </span>
                      <div>
                        <span className="block text-sm font-medium text-content-primary">
                          {opt.label}
                        </span>
                        <span className="block text-xs text-content-tertiary mt-0.5">
                          {opt.description}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="businessName"
              className="block text-sm font-medium text-content-primary mb-1.5"
            >
              Business name
            </label>
            <TextInput
              id="businessName"
              placeholder="Adeyemi Global Exports Ltd"
              value={formData.businessName}
              onChange={handleInputChange}
              required
              error={getFieldError('businessName')}
            />
          </div>

          <div>
            <label
              htmlFor="businessWebsite"
              className="block text-sm font-medium text-content-primary mb-1.5"
            >
              Business website
            </label>
            <TextInput
              id="businessWebsite"
              placeholder="https://example.com"
              value={formData.businessWebsite}
              onChange={handleInputChange}
              required
              error={getFieldError('businessWebsite')}
            />
          </div>

          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="terms" className="text-sm text-content-secondary leading-relaxed">
              I agree to the{' '}
              <Link to="#" className="font-medium link">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="#" className="font-medium link">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              color="secondary"
              className="flex-1"
              onClick={prevStep}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1"
              loading={signupMutation.isPending}
              disabled={
                !formData.businessName ||
                !formData.businessWebsite ||
                !formData.termsAccepted
              }
            >
              Create account
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
