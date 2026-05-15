'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Alert, Button, Checkbox, Input, Label, PasswordInput } from '@/components/propeller'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { useSignup, useResendConfirmation } from '@/hooks/useSignup'

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

  const fieldErrors = (signupMutation.error as { errors?: { property: string; error: string }[] } | null)?.errors
  const getFieldError = (property: string) =>
    fieldErrors?.find((e) => e.property === property)?.error

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const nextStep = () => setStep((p) => p + 1)
  const prevStep = () => setStep((p) => p - 1)

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    signupMutation.mutate(formData, { onSuccess: () => setSignupDone(true) })
  }

  const isStep1Valid =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone &&
    formData.password.length >= 8 &&
    formData.termsAccepted

  const isStep2Valid =
    formData.businessRegStatus !== 'UNREGISTERED' &&
    formData.businessName &&
    formData.businessWebsite

  if (signupDone) {
    return (
      <AuthShell altAction={null}>
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Check your inbox
          </span>
          <h1 className="mt-2 mb-2 text-[36px] leading-[1.08] font-semibold tracking-[-0.025em] text-propeller-navy">
            Confirm your email.
          </h1>
          <p className="text-[15px] text-ink-soft leading-[1.5] mb-8">
            We&rsquo;ve sent a confirmation link to{' '}
            <span className="font-medium text-ink">{formData.email}</span>. Click it to verify and
            access your dashboard.
          </p>

          <Button
            variant="secondary"
            block
            onClick={() => resendMutation.mutate({ email: formData.email })}
            loading={resendMutation.isPending}
          >
            Resend confirmation email
          </Button>

          <p className="mt-5 text-center text-[14px] text-ink-soft">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => setSignupDone(false)}
              className="text-propeller-blue font-semibold no-underline hover:underline"
            >
              Go back
            </button>
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      altAction={step === 1 ? { label: 'Sign in', href: '/auth/login' } : null}
      onBack={step === 2 ? prevStep : undefined}
    >
      <div className="mb-7">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
          {step === 1 ? 'Get started' : 'About your business'}
        </span>
        <h1 className="mt-2 mb-2 text-[36px] leading-[1.08] font-semibold tracking-[-0.025em] text-propeller-navy">
          {step === 1 ? 'Create your account.' : 'Tell us about your business.'}
        </h1>
        <p className="text-[15px] text-ink-soft leading-[1.5]">
          {step === 1
            ? 'Two minutes to set up. Talk to a real person before you ship to production.'
            : 'We use this to set up compliance and your dashboard.'}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-7">
        {[1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-propeller-blue' : 'bg-line'
            }`}
          />
        ))}
      </div>

      {signupMutation.isError && (
        <Alert severity="danger" title="Signup failed" className="mb-5">
          {fieldErrors?.length ? (
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              {fieldErrors.map((e) => (
                <li key={e.property}>{e.error}</li>
              ))}
            </ul>
          ) : (
            (signupMutation.error as { message?: string } | null)?.message ?? 'Please try again.'
          )}
        </Alert>
      )}

      {step === 1 && (
        <form
          className="flex flex-col gap-[18px]"
          onSubmit={(e) => {
            e.preventDefault()
            if (isStep1Valid) nextStep()
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="Adunni"
                value={formData.firstName}
                onChange={handleInputChange}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Okafor"
                value={formData.lastName}
                onChange={handleInputChange}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Phone number</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData((p) => ({ ...p, phone: value }))}
              aria-invalid={!!getFieldError('phone')}
            />
            {getFieldError('phone') && (
              <p className="text-[12px] text-propeller-coral">{getFieldError('phone')}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="new-password"
              required
            />
            <PasswordStrength password={formData.password} />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <Checkbox
              checked={formData.termsAccepted}
              onCheckedChange={(checked) =>
                setFormData((p) => ({ ...p, termsAccepted: checked }))
              }
            />
            <span className="text-[12px] text-ink-soft leading-[1.5]">
              I agree to the{' '}
              <Link href="/legal/terms" className="text-propeller-blue no-underline hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/legal/privacy"
                className="text-propeller-blue no-underline hover:underline"
              >
                Privacy Policy
              </Link>
              , and consent to receive product updates from Propeller.
            </span>
          </label>

          <Button
            type="submit"
            block
            className="mt-2"
            disabled={!isStep1Valid}
            iconRight={<ArrowRight size={14} strokeWidth={2.2} />}
          >
            Continue
          </Button>

          <div className="mt-4 text-center text-[14px] text-ink-soft">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-propeller-blue font-semibold no-underline hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <form className="flex flex-col gap-[18px]" onSubmit={handleSignup}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-ink whitespace-nowrap">
                Company registration status
              </span>
              {formData.businessRegStatus !== 'UNREGISTERED' && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, businessRegStatus: 'UNREGISTERED' }))
                  }
                  className="text-[12px] font-medium text-propeller-blue no-underline hover:underline"
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
                  className="rounded-[12px] border border-line-strong bg-white overflow-hidden divide-y divide-line"
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
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper focus-visible:bg-paper focus-visible:outline-none"
                      >
                        <span
                          className={`size-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            selected
                              ? 'bg-propeller-blue'
                              : 'border border-line-strong bg-white'
                          }`}
                          aria-hidden
                        >
                          {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                        </span>
                        <span className="text-[14px] font-medium text-ink">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[12px] text-ink-soft leading-[1.5]">
                  {
                    registeredOptions.find((o) => o.value === formData.businessRegStatus)
                      ?.description
                  }
                </p>
              </>
            ) : (
              <Alert severity="warning" title="Registration required">
                <span className="block mb-2">
                  Only businesses registered with the CAC can sign up today.
                </span>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, businessRegStatus: 'RC' }))}
                  className="text-[12px] font-semibold underline underline-offset-2"
                >
                  My business is registered
                </button>
              </Alert>
            )}
          </div>

          <div
            className={
              formData.businessRegStatus === 'UNREGISTERED'
                ? 'opacity-50 pointer-events-none flex flex-col gap-[18px]'
                : 'flex flex-col gap-[18px]'
            }
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                placeholder="Lumen Inc."
                value={formData.businessName}
                onChange={handleInputChange}
                autoComplete="organization"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="businessWebsite">Business website</Label>
              <Input
                id="businessWebsite"
                placeholder="https://lumen.co"
                value={formData.businessWebsite}
                onChange={handleInputChange}
                autoComplete="url"
              />
            </div>
          </div>

          <Button
            type="submit"
            block
            className="mt-2"
            disabled={!isStep2Valid}
            loading={signupMutation.isPending}
            iconRight={<ArrowRight size={14} strokeWidth={2.2} />}
          >
            Create account
          </Button>

          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center justify-center gap-2 mt-1 text-[14px] font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </form>
      )}
    </AuthShell>
  )
}
