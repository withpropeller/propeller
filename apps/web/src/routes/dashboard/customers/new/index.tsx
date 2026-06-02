'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/lib/routing'
import { Button, toast } from '@/lib/pax'
import { Check } from 'lucide-react'
import { MultiStepFormShell } from '@/components/ui/MultiStepFormShell'
import {
  type FormState,
  type FieldErrors,
  type DirectorFormState,
  INITIAL_FORM,
  validateStep,
  getTierFromVerificationType,
} from './schema'
import {
  INDIVIDUAL_STEPS,
  BUSINESS_STEPS,
  StepCustomerType,
  StepIndividualInfo,
  StepBusinessInfo,
  StepAddress,
  StepIndividualIdentity,
  StepBusinessIdentity,
  StepDirectors,
  StepMetadata,
  StepReview,
} from '../_components/steps'
import { useQueryClient } from '@tanstack/react-query'
import { customInstance } from '@/lib/orvalClient'

// ─── Types ───────────────────────────────────────────────────────────────────────

interface CountryStates {
  [code: string]: { name: string; divisions: { [divCode: string]: string } }
}

// ─── Constants ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'customer-draft'

function getInitialData(): any {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
  }
  return null
}

// ─── Page Component ───────────────────────────────────────────────────────────────

export default function NewCustomerPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(() => {
    const saved = getInitialData()
    if (!saved) return INITIAL_FORM
    const { _meta, _directors, ...formData } = saved
    return { ...INITIAL_FORM, ...formData }
  })
  const [directors, setDirectors] = useState<DirectorFormState[]>(() => {
    const saved = getInitialData()
    return Array.isArray(saved?._directors) ? saved._directors : []
  })
  const [step, setStep] = useState(1)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [metadataItems, setMetadataItems] = useState<
    { key: string; value: string }[]
  >(() => {
    const saved = getInitialData()
    return Array.isArray(saved?._meta) ? saved._meta : []
  })
  const [created, setCreated] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // ── Country / state data ───────────────────────────────────────────────────
  const [countryStates, setCountryStates] = useState<CountryStates>({})

  useEffect(() => {
    fetch('/country-states.json')
      .then((r) => r.json())
      .then(setCountryStates)
      .catch(() => {})
  }, [])

  const countryOptions = Object.entries(countryStates).map(([code, c]) => ({
    value: code,
    label: c.name,
  }))

  const stateOptions =
    form.countryCode && countryStates[form.countryCode]
      ? Object.entries(countryStates[form.countryCode].divisions).map(
          ([code, name]) => ({ value: code, label: name }),
        )
      : []

  // ── Derived state ──────────────────────────────────────────────────────────
  const STEPS =
    form.customerType === 'business' ? BUSINESS_STEPS : INDIVIDUAL_STEPS
  const isReviewStep = step === STEPS[STEPS.length - 1].id

  // ── Helpers ────────────────────────────────────────────────────────────────
  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  // ── Persist to localStorage ────────────────────────────────────────────────
  useEffect(() => {
    if (isDirty) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...form, _meta: metadataItems, _directors: directors }),
        )
      } catch {
        // ignore
      }
    }
  }, [form, metadataItems, directors, isDirty])

  // ── Unsaved changes warning ────────────────────────────────────────────────
  useEffect(() => {
    if (!isDirty) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // ── Metadata handlers ──────────────────────────────────────────────────────
  function addMetaItem(key: string, value: string) {
    setMetadataItems((prev) => [...prev, { key, value }])
    setIsDirty(true)
  }

  function removeMetaItem(index: number) {
    setMetadataItems((prev) => prev.filter((_, i) => i !== index))
    setIsDirty(true)
  }

  // ── Director handlers ──────────────────────────────────────────────────────
  function addDirector(d: Omit<DirectorFormState, 'id'>) {
    setDirectors((prev) => [
      ...prev,
      { ...d, id: `${Date.now()}-${Math.random()}` },
    ])
    setIsDirty(true)
    if (errors.directors) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.directors
        return next
      })
    }
  }

  function removeDirector(id: string) {
    setDirectors((prev) => prev.filter((d) => d.id !== id))
    setIsDirty(true)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function sanitize(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined),
    )
  }

  function buildPayload(): Record<string, any> {
    const verifications =
      form.verificationType && form.verificationType !== 'none'
        ? [{ type: form.verificationType, status: 'verified' }]
        : undefined

    if (form.customerType === 'individual') {
      const tier = getTierFromVerificationType(form.verificationType)

      const claims: Record<string, any> = {
        individualInformation: sanitize({
          firstName: form.firstName,
          lastName: form.lastName,
          middleName: form.middleName,
          title: form.title,
          gender: form.gender,
          email: form.email,
          phoneNumber: form.phoneNumber,
          dateOfBirth: form.dateOfBirth,
          nationalityCode: form.nationalityCode,
        }),
      }

      if (tier === 'tier-2' || tier === 'tier-3') {
        claims.individualIdentity = sanitize({
          type: form.idType,
          id: form.idNumber,
          url: form.idDocumentUrl,
          issuingCountry: form.issuingCountry,
        })
      }

      if (tier === 'tier-3') {
        claims.individualAddress = sanitize({
          addressLineOne: form.addressLineOne,
          addressLineTwo: form.addressLineTwo,
          postalCode: form.postalCode,
          countryCode: form.countryCode,
          state: form.stateCode,
          city: form.city,
        })
      }

      return {
        name: [form.firstName, form.middleName, form.lastName]
          .filter(Boolean)
          .join(' '),
        type: 'individual',
        ...(form.reference.trim() ? { reference: form.reference.trim() } : {}),
        ...(verifications ? { verifications } : {}),
        ...(tier !== 'tier-0' ? { claims } : {}),
      }
    }

    // Business
    const claims: Record<string, any> = {
      businessInformation: sanitize({
        registrationName: form.registrationName,
        phoneNumber: form.businessPhone,
        email: form.businessEmail,
      }),
      businessAddress: sanitize({
        addressLineOne: form.addressLineOne,
        addressLineTwo: form.addressLineTwo,
        postalCode: form.postalCode,
        countryCode: form.countryCode,
        state: form.stateCode,
        city: form.city,
      }),
      businessIdentity: sanitize({
        type: 'cac',
        id: form.businessIdNumber,
        url: form.businessIdUrl,
        issuingCountry: form.businessIssuingCountry,
      }),
    }

    if (directors.length > 0) {
      claims.businessDirectors = directors.map((d) => ({
        ...sanitize({
          firstName: d.firstName,
          lastName: d.lastName,
          middleName: d.middleName,
          title: d.title,
          gender: d.gender,
          nationalityCode: d.nationalityCode,
          phoneNumber: d.phoneNumber,
          dateOfBirth: d.dateOfBirth,
          email: d.email,
        }),
        identity: sanitize({
          type: d.idType,
          id: d.idNumber,
          url: d.idDocumentUrl,
          issuingCountry: d.issuingCountry,
        }),
      }))
    }

    return {
      name: form.registrationName,
      type: 'business',
      ...(form.reference.trim() ? { reference: form.reference.trim() } : {}),
      ...(verifications ? { verifications } : {}),
      claims,
    }
  }

  async function submit() {
    const payload = buildPayload()
    setIsSubmitting(true)
    try {
      await customInstance('/customers', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      queryClient.invalidateQueries({ queryKey: ['/customers'] })
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
      setIsDirty(false)
      setCreated(true)
    } catch (err: any) {
      toast({
        title: 'Failed to create customer',
        description: err?.message ?? 'Something went wrong.',
        severity: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function handleNext() {
    if (isReviewStep) {
      submit()
      return
    }

    const stepErrors = validateStep(step, form.customerType, form, directors)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setErrors({})
    setCompleted((prev) => new Set(prev).add(step))

    const currentIndex = STEPS.findIndex((s) => s.id === step)
    const nextStep = STEPS[currentIndex + 1]
    if (nextStep) setStep(nextStep.id)
  }

  function handleBack() {
    const currentIndex = STEPS.findIndex((s) => s.id === step)
    if (currentIndex > 0) {
      setErrors({})
      setStep(STEPS[currentIndex - 1].id)
    } else {
      router.push('/dashboard/customers')
    }
  }

  function handleClose() {
    router.push('/dashboard/customers')
  }

  function handleEditFromReview(targetStep: number) {
    setStep(targetStep)
  }

  // ── Success screen ─────────────────────────────────────────────────────────

  const displayName =
    form.customerType === 'business'
      ? form.registrationName
      : [form.firstName, form.lastName].filter(Boolean).join(' ')

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-feedback-success-subtle text-feedback-success-main rounded-full flex items-center justify-center">
          <Check width={32} height={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-content-primary">
            Customer created
          </h3>
          <p className="text-sm text-content-tertiary max-w-xs mx-auto">
            <span className="font-medium text-content-primary">{displayName}</span>{' '}
            has been created successfully.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            color="secondary"
            onClick={() => router.push('/dashboard/customers')}
          >
            Back to customers
          </Button>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isIndividual = form.customerType === 'individual'
  const isBusiness = form.customerType === 'business'
  const metadataStep = isIndividual ? 5 : 6

  return (
    <MultiStepFormShell
      title="Create a customer"
      steps={STEPS}
      currentStep={step}
      completedSteps={completed}
      onNext={handleNext}
      onBack={handleBack}
      onClose={handleClose}
      nextLabel={isReviewStep ? 'Create customer' : undefined}
      canAdvance={step === 1 ? !!form.customerType : true}
      isSubmitting={isSubmitting}
      submittingLabel="Creating&hellip;"
    >
      {/* Step 1: Customer type (shared) */}
      {step === 1 && (
        <StepCustomerType form={form} set={set} errors={errors} />
      )}

      {/* Individual steps */}
      {isIndividual && step === 2 && (
        <StepIndividualInfo
          form={form}
          set={set}
          errors={errors}
          countryOptions={countryOptions}
        />
      )}
      {isIndividual && step === 3 && (
        <StepAddress
          form={form}
          set={set}
          errors={errors}
          countryOptions={countryOptions}
          stateOptions={stateOptions}
        />
      )}
      {isIndividual && step === 4 && (
        <StepIndividualIdentity
          form={form}
          set={set}
          errors={errors}
          countryOptions={countryOptions}
        />
      )}
      {isIndividual && step === metadataStep && (
        <StepMetadata
          metadataItems={metadataItems}
          onAdd={addMetaItem}
          onRemove={removeMetaItem}
        />
      )}

      {/* Business steps */}
      {isBusiness && step === 2 && (
        <StepBusinessInfo form={form} set={set} errors={errors} />
      )}
      {isBusiness && step === 3 && (
        <StepAddress
          form={form}
          set={set}
          errors={errors}
          countryOptions={countryOptions}
          stateOptions={stateOptions}
        />
      )}
      {isBusiness && step === 4 && (
        <StepBusinessIdentity
          form={form}
          set={set}
          errors={errors}
          countryOptions={countryOptions}
        />
      )}
      {isBusiness && step === 5 && (
        <StepDirectors
          directors={directors}
          onAdd={addDirector}
          onRemove={removeDirector}
          errors={errors}
          countryOptions={countryOptions}
        />
      )}
      {isBusiness && step === metadataStep && (
        <StepMetadata
          metadataItems={metadataItems}
          onAdd={addMetaItem}
          onRemove={removeMetaItem}
        />
      )}

      {/* Review (shared) */}
      {isReviewStep && (
        <StepReview
          form={form}
          directors={directors}
          metadataItems={metadataItems}
          onEdit={handleEditFromReview}
          countryOptions={countryOptions}
          stateOptions={stateOptions}
        />
      )}
    </MultiStepFormShell>
  )
}
