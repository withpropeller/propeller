'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  TextInput,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
  Checkbox,
} from '@/lib/pax'
import { ArrowLeft, Check } from 'lucide-react'
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

  const isStep1Valid =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone &&
    formData.password.length >= 8

  const isStep2Valid =
    formData.businessRegStatus !== 'UNREGISTERED' &&
    formData.businessName &&
    formData.businessWebsite &&
    formData.termsAccepted

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
                autoComplete="given-name"
                required
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
                placeholder="Olurin"
                value={formData.lastName}
                onChange={handleInputChange}
                autoComplete="family-name"
                required
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-primary mb-1.5">
              Phone number
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
              aria-invalid={!!getFieldError('phone')}
            />
            {getFieldError('phone') && (
              <p className="mt-1.5 text-xs text-feedback-danger-main">
                {getFieldError('phone')}
              </p>
            )}
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
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <PasswordStrength password={formData.password} className="mt-3" />
          </div>

          <Button
            variant="default"
            className="w-full mt-2"
            disabled={!isStep1Valid}
            type="submit"
          >
            Continue
          </Button>
        </form>
      )}

      {step === 2 && (
        <form className="space-y-5" onSubmit={handleSignup}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-content-primary">
                Company registration status
              </span>
              {formData.businessRegStatus !== 'UNREGISTERED' && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, businessRegStatus: 'UNREGISTERED' }))
                  }
                  className="text-sm font-medium link"
                >
                  Not registered?
                </button>
              )}
            </div>

            {formData.businessRegStatus !== 'UNREGISTERED' ? (
              <>
                <div
                  role="radiogroup"
                  aria-label="Company registration status"
                  className="rounded-lg border border-border-primary-main bg-surface-primary divide-y divide-border-primary-light overflow-hidden"
                >
                  {registeredOptions.map((opt) => {
                    const selected = formData.businessRegStatus === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setFormData((p) => ({ ...p, businessRegStatus: opt.value }))
                        }
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:outline-none"
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            selected
                              ? 'bg-action-primary-main'
                              : 'border border-border-tertiary-main bg-surface-primary'
                          }`}
                          aria-hidden
                        >
                          {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                        </span>
                        <span className="text-sm font-medium text-content-primary">
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <p className="mt-2 text-xs text-content-tertiary leading-relaxed">
                  {
                    registeredOptions.find(
                      (o) => o.value === formData.businessRegStatus
                    )?.description
                  }
                </p>
              </>
            ) : (
              <Alert severity="warning">
                <AlertTitle>Registration required</AlertTitle>
                <AlertDescription className="space-y-2">
                  <span className="block">
                    Only businesses registered with the CAC can sign up today.
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, businessRegStatus: 'RC' }))
                    }
                    className="text-xs font-medium link"
                  >
                    My business is registered
                  </button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div
            className={
              formData.businessRegStatus === 'UNREGISTERED'
                ? 'opacity-50 pointer-events-none space-y-4'
                : 'space-y-4'
            }
          >
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium text-content-primary mb-1.5"
              >
                Business name
              </label>
              <TextInput
                id="businessName"
                placeholder="Acme Corp"
                value={formData.businessName}
                onChange={handleInputChange}
                autoComplete="organization"
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
                placeholder="https://acme.co"
                value={formData.businessWebsite}
                onChange={handleInputChange}
                autoComplete="url"
              />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={handleCheckboxChange}
              />
              <label
                htmlFor="terms"
                className="text-xs text-content-secondary leading-relaxed cursor-pointer select-none"
              >
                I have read and agree to Paystack Issuing's General Terms, including the
                Privacy Policy.
              </label>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="default"
              className="w-full"
              disabled={!isStep2Valid || signupMutation.isPending}
              loading={signupMutation.isPending}
              type="submit"
            >
              Create account
            </Button>
            <Button
              variant="ghost"
              color="secondary"
              size="sm"
              type="button"
              onClick={prevStep}
              className="w-full gap-2"
            >
              <ArrowLeft size={14} />
              Back
            </Button>
          </div>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-content-secondary">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium link">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
