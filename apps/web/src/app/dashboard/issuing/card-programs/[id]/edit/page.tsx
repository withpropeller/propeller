'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Skeleton,
  toast,
} from '@/lib/pax'
import { Check } from 'lucide-react'
import { MultiStepFormShell } from '@/components/ui/MultiStepFormShell'
import {
  type FormState,
  type FieldErrors,
  INITIAL_FORM,
  validateStep,
} from '../../create/schema'
import {
  getSteps,
  Step1TypeAndName,
  Step2Details,
  Step3Authorization,
  Step4Personalization,
  Step5Distribution,
  StepReview,
} from '../../_components/steps'
import { useCardProgramControllerGet } from '@/api/card-programs/card-programs'
import { useCardProgramControllerPutDraft } from '@/api/card-programs/card-programs'
import { useCardProgramControllerRequestApproval } from '@/api/card-programs/card-programs'
import { useAccountControllerGet } from '@/api/accounts/accounts'
import { useCardBinControllerGetAll } from '@/api/card-bins/card-bins'
import { useWebhookControllerGet } from '@/api/webhooks/webhooks'
import { useQueryClient } from '@tanstack/react-query'
import { useMode } from '@/context/ModeContext'
import type {
  PatchCardProgramDraftDto,
  CardProgramAuthorizationDtoFundingSourceType,
  CardProgramAuthorizationDtoTimeoutDefault,
  CardProgramDistributionDtoType,
} from '@/api/model'

/** Extract a human-readable description from API validation errors */
function describeApiError(err: any): string {
  const validationErrors: { property: string; error: string }[] | undefined =
    err?.errors
  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    console.error('[CardProgram] Validation errors:', validationErrors)
    return validationErrors
      .slice(0, 3)
      .map((e) => `${e.property}: ${e.error}`)
      .join('; ')
  }
  return err?.message ?? 'Something went wrong.'
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function EditCardProgramPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isSandboxMode } = useMode()

  // ── Fetch existing program ────────────────────────────────────────────────
  const {
    data: programData,
    isLoading: programLoading,
    error: programError,
  } = useCardProgramControllerGet(id)

  const program: any = (programData as any)?.data ?? programData
  const isEditable =
    program?.status === 'new' || program?.status === 'changes-requested'

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [initialized, setInitialized] = useState(false)
  const [step, setStep] = useState(1)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [created, setCreated] = useState<any>(null)

  // Populate form from API response
  useEffect(() => {
    if (program && !initialized) {
      setForm({
        type: program.type ?? '',
        name: program.name ?? '',
        network: program.network ?? '',
        currency: program.currency ?? 'NGN',
        binType: program.bin ? 'dedicated' : 'shared',
        bin: program.bin ?? '',
        quantity: program.quantity ? String(program.quantity) : '',
        fundingSourceType:
          program.authorization?.fundingSourceType ?? 'pool-account',
        poolAccount: program.authorization?.poolAccount ?? '',
        settlementAccount:
          program.authorization?.earlyRefundAccount ?? '',
        webhook: program.authorization?.webhook ?? '',
        timeoutDefault:
          program.authorization?.timeoutDefault ?? 'approve',
        frontArtworkFile:
          program.personalization?.frontArtworkFile ?? '',
        defaultCardholderName:
          program.personalization?.defaultCardholderName ?? '',
        distributionType: program.distribution?.type ?? 'bulked',
        phoneNumber:
          program.distribution?.shippingAddress?.phoneNumber ?? '',
        addressLine1:
          program.distribution?.shippingAddress?.addressLineOne ?? '',
        addressLine2:
          program.distribution?.shippingAddress?.addressLineTwo ?? '',
        country:
          program.distribution?.shippingAddress?.countryCode ?? '',
        state: program.distribution?.shippingAddress?.state ?? '',
        city: program.distribution?.shippingAddress?.city ?? '',
      })
      // Mark all data steps as completed (everything except review)
      const programSteps = getSteps(program.type || 'virtual')
      const completedIds = programSteps
        .slice(0, -1)
        .map((s) => s.id)
      setCompleted(new Set(completedIds))
      setInitialized(true)
    }
  }, [program, initialized])

  // ── API hooks ─────────────────────────────────────────────────────────────
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
    patchDraftMutation.isPending || requestApprovalMutation.isPending

  // ── Helpers ───────────────────────────────────────────────────────────────
  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function buildPatchPayload(): PatchCardProgramDraftDto {
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
      if (form.binType === 'dedicated' && form.bin)
        payload.bin = form.bin
      if (form.quantity) payload.quantity = Number(form.quantity)
      payload.personalization = {
        frontArtworkFile: form.frontArtworkFile || undefined,
        printCardholderName: false,
        defaultCardholderName:
          form.defaultCardholderName || undefined,
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
  }

  function saveDraft(onSuccess?: () => void) {
    patchDraftMutation.mutate(
      { id, data: buildPatchPayload() },
      {
        onSuccess: () => {
          toast({ title: 'Draft saved', severity: 'success' })
          onSuccess?.()
        },
        onError: (err: any) => {
          toast({
            title: 'Failed to save',
            description: describeApiError(err),
            severity: 'danger',
          })
        },
      },
    )
  }

  function requestApproval() {
    patchDraftMutation.mutate(
      { id, data: buildPatchPayload() },
      {
        onSuccess: () => {
          requestApprovalMutation.mutate(
            { id },
            {
              onSuccess: (res: any) => {
                const p = res?.data ?? res
                setCreated(p ?? { id, name: form.name })
                queryClient.invalidateQueries({
                  queryKey: ['/card-programs'],
                })
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
            title: 'Failed to save',
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
    const idx = steps.findIndex((s) => s.id === step)
    const next = steps[idx + 1]
    saveDraft(() => {
      if (next) setStep(next.id)
    })
  }

  function handleBack() {
    const idx = steps.findIndex((s) => s.id === step)
    if (idx > 0) {
      setErrors({})
      setStep(steps[idx - 1].id)
    } else {
      router.push('/dashboard/issuing/card-programs')
    }
  }

  // ── Loading / error / non-editable states ─────────────────────────────────

  if (programLoading) {
    return (
      <div className="space-y-6 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (programError || !program) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <p className="text-sm text-content-tertiary">
          Card program not found or could not be loaded.
        </p>
        <Button
          variant="outline"
          color="secondary"
          onClick={() =>
            router.push('/dashboard/issuing/card-programs')
          }
        >
          Back to programs
        </Button>
      </div>
    )
  }

  if (!isEditable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <p className="text-sm text-content-tertiary">
          This card program can no longer be edited (status:{' '}
          <span className="font-medium text-content-primary">
            {program.status}
          </span>
          ).
        </p>
        <Button
          variant="outline"
          color="secondary"
          onClick={() =>
            router.push(
              `/dashboard/issuing/card-programs/${id}`,
            )
          }
        >
          View program
        </Button>
      </div>
    )
  }

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
              {form.name}
            </span>{' '}
            has been submitted for review.
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
                `/dashboard/issuing/card-programs/${id}`,
              )
            }
          >
            View program
          </Button>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <>
      <MultiStepFormShell
        title={`Edit: ${form.name || 'Card program'}`}
        steps={steps}
        currentStep={step}
        completedSteps={completed}
        onNext={handleNext}
        onBack={handleBack}
        onClose={() =>
          router.push('/dashboard/issuing/card-programs')
        }
        onSave={() => saveDraft()}
        saveDisabled={isSubmitting}
        primaryAction={{
          label: 'Request approval',
          onClick: requestApproval,
          disabled: !isReviewStep || isSubmitting,
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
          <Step4Personalization
            form={form}
            set={set}
            errors={errors}
          />
        )}
        {step === 5 && form.type === 'physical' && (
          <Step5Distribution form={form} set={set} errors={errors} />
        )}
        {isReviewStep && (
          <StepReview
            form={form}
            onEdit={(targetStep) => setStep(targetStep)}
            accounts={accounts}
            webhooks={webhooks}
          />
        )}
      </MultiStepFormShell>
    </>
  )
}
