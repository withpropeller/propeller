'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  toast,
} from '@/lib/pax'
import { Check } from 'lucide-react'
import { MultiStepFormShell } from '@/components/ui/MultiStepFormShell'
import {
  type FormState,
  type FieldErrors,
  INITIAL_FORM,
  validateStep,
} from './schema'
import {
  getSteps,
  Step1TypeAndName,
  Step2Details,
  Step3Authorization,
  Step4Personalization,
  Step5Distribution,
  StepReview,
} from '../_components/steps'
import { useCardProgramControllerCreate } from '@/api/card-programs/card-programs'
import { useCardProgramControllerPutDraft } from '@/api/card-programs/card-programs'
import { useCardProgramControllerRequestApproval } from '@/api/card-programs/card-programs'
import { useAccountControllerGet } from '@/api/accounts/accounts'
import { useCardBinControllerGetAll } from '@/api/card-bins/card-bins'
import { useWebhookControllerGet } from '@/api/webhooks/webhooks'
import { useMode } from '@/context/ModeContext'
import { useQueryClient } from '@tanstack/react-query'
import type {
  CreateCardProgramDto,
  PatchCardProgramDraftDto,
  CardProgramAuthorizationDtoFundingSourceType,
  CardProgramAuthorizationDtoTimeoutDefault,
  CreateCardProgramDtoNetwork,
  CreateCardProgramDtoCurrency,
  CardProgramDistributionDtoType,
} from '@/api/model'

// ─── Constants ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'card-program-draft'

/** Extract a human-readable description from API validation errors */
function describeApiError(err: any): string {
  // The orvalClient now includes `errors` from the backend `error` field
  const validationErrors: { property: string; error: string }[] | undefined =
    err?.errors
  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    // Log full details for debugging
    console.error('[CardProgram] Validation errors:', validationErrors)
    // Show the first few field errors in the toast
    return validationErrors
      .slice(0, 3)
      .map((e) => `${e.property}: ${e.error}`)
      .join('; ')
  }
  return err?.message ?? 'Something went wrong.'
}

// ─── Page Component ─────────────────────────────────────────────────────────────

export default function CreateCardProgramPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isSandboxMode } = useMode()

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return { ...INITIAL_FORM, ...JSON.parse(saved) }
      } catch {
        // ignore
      }
    }
    return INITIAL_FORM
  })
  const [step, setStep] = useState(1)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [draftId, setDraftId] = useState<string | null>(null)
  const [created, setCreated] = useState<any>(null)
  const [isDirty, setIsDirty] = useState(false)

  // ── API hooks ─────────────────────────────────────────────────────────────
  const createMutation = useCardProgramControllerCreate()
  const patchDraftMutation = useCardProgramControllerPutDraft()
  const requestApprovalMutation =
    useCardProgramControllerRequestApproval()

  const { data: accountsData, isLoading: accountsLoading } =
    useAccountControllerGet({ limit: 50 } as any)
  const { data: binsData, isLoading: binsLoading } =
    useCardBinControllerGetAll({ limit: 50 } as any)
  const { data: webhooksData, isLoading: webhooksLoading } =
    useWebhookControllerGet()

  const accounts: any[] = (accountsData?.data as any) ?? []
  const bins: any[] = (binsData?.data as any) ?? []
  const webhooks: any[] = (webhooksData?.data as any) ?? []

  // ── Derived state ─────────────────────────────────────────────────────────
  const steps = getSteps(form.type || 'virtual')
  const isReviewStep = step === steps[steps.length - 1]?.id
  const isSubmitting =
    createMutation.isPending ||
    patchDraftMutation.isPending ||
    requestApprovalMutation.isPending

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  // Persist to localStorage
  useEffect(() => {
    if (isDirty) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
      } catch {
        // ignore
      }
    }
  }, [form, isDirty])

  // Unsaved changes warning
  useEffect(() => {
    if (!isDirty) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () =>
      window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // ── Payload builders ──────────────────────────────────────────────────────

  /**
   * Build the full POST payload. For physical cards, the API requires
   * quantity, personalization, and distribution — so this should only
   * be called when all data is available.
   */
  const buildCreatePayload = useCallback((): CreateCardProgramDto => {
    const payload: CreateCardProgramDto = {
      name: form.name,
      network: form.network as CreateCardProgramDtoNetwork,
      type: form.type as 'physical' | 'virtual',
      currency: form.currency as CreateCardProgramDtoCurrency,
      authorization: {
        fundingSourceType:
          form.fundingSourceType as CardProgramAuthorizationDtoFundingSourceType,
        poolAccount: form.poolAccount || undefined,
        earlyRefundAccount: form.settlementAccount || undefined,
        webhook: form.webhook || undefined,
        timeoutDefault:
          form.timeoutDefault as CardProgramAuthorizationDtoTimeoutDefault,
      },
    }

    if (form.type === 'physical') {
      if (form.quantity) payload.quantity = Number(form.quantity)
      if (form.binType === 'dedicated' && form.bin) {
        payload.bin = form.bin as any
      }
      payload.personalization = {
        frontArtworkFile: form.frontArtworkFile || undefined,
        printCardholderName: false,
        defaultCardholderName: form.defaultCardholderName || undefined,
      }
      payload.distribution = {
        type: form.distributionType as CardProgramDistributionDtoType,
        shippingAddress: {
          city: form.city || form.state,
          state: form.state,
          countryCode: form.country,
          phoneNumber: form.phoneNumber,
          addressLineOne: form.addressLine1,
          ...(form.addressLine2
            ? { addressLineTwo: form.addressLine2 }
            : {}),
        },
        returnAddress: {
          city: form.city || form.state,
          state: form.state,
          countryCode: form.country,
          phoneNumber: form.phoneNumber,
          addressLineOne: form.addressLine1,
          ...(form.addressLine2
            ? { addressLineTwo: form.addressLine2 }
            : {}),
        },
      }
    }

    return payload
  }, [form])

  const buildPatchPayload = useCallback((): PatchCardProgramDraftDto => {
    const payload: PatchCardProgramDraftDto = {
      name: form.name,
      network: form.network as any,
      currency: form.currency as any,
      authorization: {
        fundingSourceType:
          form.fundingSourceType as CardProgramAuthorizationDtoFundingSourceType,
        poolAccount: form.poolAccount || undefined,
        earlyRefundAccount: form.settlementAccount || undefined,
        webhook: form.webhook || undefined,
        timeoutDefault:
          form.timeoutDefault as CardProgramAuthorizationDtoTimeoutDefault,
      },
    }

    if (form.type === 'physical') {
      if (form.binType === 'dedicated' && form.bin) {
        payload.bin = form.bin
      }
      if (form.quantity) {
        payload.quantity = Number(form.quantity)
      }
      payload.personalization = {
        frontArtworkFile: form.frontArtworkFile || undefined,
        printCardholderName: false,
        defaultCardholderName: form.defaultCardholderName || undefined,
      }
      payload.distribution = {
        type: form.distributionType as CardProgramDistributionDtoType,
        shippingAddress: form.phoneNumber
          ? {
              city: form.city || form.state,
              state: form.state,
              countryCode: form.country,
              phoneNumber: form.phoneNumber,
              addressLineOne: form.addressLine1,
              ...(form.addressLine2
                ? { addressLineTwo: form.addressLine2 }
                : {}),
            }
          : undefined,
        returnAddress: form.phoneNumber
          ? {
              city: form.city || form.state,
              state: form.state,
              countryCode: form.country,
              phoneNumber: form.phoneNumber,
              addressLineOne: form.addressLine1,
              ...(form.addressLine2
                ? { addressLineTwo: form.addressLine2 }
                : {}),
            }
          : undefined,
      }
    }

    return payload
  }, [form])

  // ── Draft operations ──────────────────────────────────────────────────────

  function createDraft(onSuccess?: () => void) {
    const payload = buildCreatePayload()
    console.log('[CardProgram] Creating draft with payload:', JSON.stringify(payload, null, 2))
    createMutation.mutate(
      { data: payload },
      {
        onSuccess: (res: any) => {
          const program = res?.data ?? res
          setDraftId(program?.id)
          queryClient.invalidateQueries({ queryKey: ['/card-programs'] })
          toast({ title: 'Draft saved', severity: 'success' })
          onSuccess?.()
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to save draft',
            description: describeApiError(err),
            severity: 'danger',
          })
        },
      },
    )
  }

  function saveDraft(onSuccess?: () => void) {
    if (!draftId) return
    patchDraftMutation.mutate(
      { id: draftId, data: buildPatchPayload() },
      {
        onSuccess: () => {
          toast({ title: 'Draft saved', severity: 'success' })
          onSuccess?.()
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to save draft',
            description: describeApiError(err),
            severity: 'danger',
          })
        },
      },
    )
  }

  function requestApproval() {
    if (!draftId) return
    patchDraftMutation.mutate(
      { id: draftId, data: buildPatchPayload() },
      {
        onSuccess: () => {
          requestApprovalMutation.mutate(
            { id: draftId },
            {
              onSuccess: (res: any) => {
                const program = res?.data ?? res
                setCreated(program ?? { id: draftId, name: form.name })
                queryClient.invalidateQueries({
                  queryKey: ['/card-programs'],
                })
                try {
                  localStorage.removeItem(STORAGE_KEY)
                } catch {
                  // ignore
                }
                setIsDirty(false)
              },
              onError: (err: any) => {
                toast({
                  title: 'Failed to request approval',
                  description: describeApiError(err),
                  severity: 'danger',
                })
              },
            },
          )
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to save draft',
            description: describeApiError(err),
            severity: 'danger',
          })
        },
      },
    )
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function handleNext() {
    if (isReviewStep) {
      requestApproval()
      return
    }

    const stepErrors = validateStep(step, form, isSandboxMode)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setErrors({})
    setCompleted((prev) => new Set(prev).add(step))

    const currentIndex = steps.findIndex((s) => s.id === step)
    const nextStep = steps[currentIndex + 1]

    // Determine when to create the draft:
    // - Virtual cards: after Step 3 (auth) — API only needs name, network, type, currency, authorization
    // - Physical cards: after Step 5 (distribution) — API also requires quantity, personalization, distribution
    const createDraftAfterStep = form.type === 'physical' ? 5 : 3

    if (step === createDraftAfterStep && !draftId) {
      createDraft(() => {
        if (nextStep) setStep(nextStep.id)
      })
      return
    }

    // After draft creation: patch on subsequent steps
    if (step > createDraftAfterStep && draftId) {
      saveDraft(() => {
        if (nextStep) setStep(nextStep.id)
      })
      return
    }

    if (nextStep) setStep(nextStep.id)
  }

  function handleBack() {
    const currentIndex = steps.findIndex((s) => s.id === step)
    if (currentIndex > 0) {
      setErrors({})
      setStep(steps[currentIndex - 1].id)
    } else {
      router.push('/dashboard/issuing/card-programs')
    }
  }

  function handleClose() {
    router.push('/dashboard/issuing/card-programs')
  }

  function handleSave() {
    if (draftId) {
      saveDraft()
    } else {
      const needed =
        form.type === 'physical'
          ? 'all steps before Review'
          : 'steps 1\u20133'
      toast({
        title: `Complete ${needed} to save a draft`,
        severity: 'danger',
      })
    }
  }

  function handleEditFromReview(targetStep: number) {
    setStep(targetStep)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-feedback-success-subtle text-feedback-success-main rounded-full flex items-center justify-center">
          <Check width={32} height={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-content-primary">
            Approval requested
          </h3>
          <p className="text-sm text-content-tertiary max-w-xs mx-auto">
            <span className="font-medium text-content-primary">
              {created?.name}
            </span>{' '}
            has been submitted for review. You&apos;ll be notified once
            it&apos;s approved.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            color="secondary"
            onClick={() =>
              router.push('/dashboard/issuing/card-programs')
            }
          >
            Back to programs
          </Button>
          <Button
            variant="default"
            color="primary"
            onClick={() =>
              router.push(
                `/dashboard/issuing/card-programs/${created?.id}`,
              )
            }
          >
            View program
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <MultiStepFormShell
        title="Create a card program"
        steps={steps}
        currentStep={step}
        completedSteps={completed}
        onNext={handleNext}
        onBack={handleBack}
        onClose={handleClose}
        onSave={handleSave}
        saveDisabled={!draftId || isSubmitting}
        primaryAction={{
          label: 'Request approval',
          onClick: requestApproval,
          disabled: !draftId || !isReviewStep || isSubmitting,
        }}
        nextLabel={isReviewStep ? 'Request approval' : undefined}
        canAdvance={step === 1 ? !!(form.name.trim() && form.type) : true}
        isSubmitting={isSubmitting}
        submittingLabel="Saving…"
      >
        {step === 1 && (
          <Step1TypeAndName form={form} set={set} errors={errors} />
        )}
        {step === 2 && (
          <Step2Details
            form={form}
            set={set}
            errors={errors}
            bins={bins}
            binsLoading={binsLoading}
            isSandboxMode={isSandboxMode}
          />
        )}
        {step === 3 && (
          <Step3Authorization
            form={form}
            set={set}
            errors={errors}
            accounts={accounts}
            accountsLoading={accountsLoading}
            webhooks={webhooks}
            webhooksLoading={webhooksLoading}
          />
        )}
        {step === 4 && form.type === 'physical' && (
          <Step4Personalization form={form} set={set} errors={errors} />
        )}
        {step === 5 && form.type === 'physical' && (
          <Step5Distribution form={form} set={set} errors={errors} />
        )}
        {isReviewStep && (
          <StepReview
            form={form}
            onEdit={handleEditFromReview}
            accounts={accounts}
            webhooks={webhooks}
          />
        )}
      </MultiStepFormShell>
    </>
  )
}
