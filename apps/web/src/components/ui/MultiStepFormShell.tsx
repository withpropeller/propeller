'use client'

import { ReactNode } from 'react'
import { Button } from '@/lib/pax'
import { ArrowLeft, Check } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface StepConfig {
  /** Unique step id (1-based) */
  id: number
  /** Short label shown in stepper (1-2 words) */
  label: string
}

export interface MultiStepFormShellProps {
  /** Page title shown in header */
  title: string
  /** Ordered step definitions */
  steps: StepConfig[]
  /** Current active step id */
  currentStep: number
  /** Set of step ids that have been completed */
  completedSteps: Set<number>

  // ── Navigation ──────────────────────────────────────────────────────────────
  onNext: () => void
  onBack: () => void
  onClose: () => void

  // ── Header actions ──────────────────────────────────────────────────────────
  /** Optional save handler — button hidden if omitted */
  onSave?: () => void
  saveDisabled?: boolean
  saveLabel?: string
  /** Optional primary action (e.g. "Request Approval") — button hidden if omitted */
  primaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
  }

  // ── Footer config ───────────────────────────────────────────────────────────
  /** Label for the next/submit button. Defaults to "Next" or "Submit" on last step */
  nextLabel?: string
  /** Whether the next button should be disabled beyond normal rules */
  canAdvance?: boolean
  /** Whether a submit action is in progress */
  isSubmitting?: boolean
  /** Loading label when submitting */
  submittingLabel?: string

  // ── Content ─────────────────────────────────────────────────────────────────
  children: ReactNode
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function MultiStepFormShell({
  title,
  steps,
  currentStep,
  completedSteps,
  onNext,
  onBack,
  onClose,
  onSave,
  saveDisabled,
  saveLabel = 'Save',
  primaryAction,
  nextLabel,
  canAdvance = true,
  isSubmitting = false,
  submittingLabel = 'Saving\u2026',
  children,
}: MultiStepFormShellProps) {
  const isFirstStep = currentStep === steps[0]?.id
  const isLastStep = currentStep === steps[steps.length - 1]?.id
  const resolvedNextLabel =
    nextLabel ?? (isLastStep ? 'Submit' : 'Next')

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-content-primary">
          {title}
        </h1>

        <div className="flex items-center gap-3">
          {onSave && (
            <Button
              variant="outline"
              color="secondary"
              onClick={onSave}
              disabled={saveDisabled || isSubmitting}
            >
              {saveLabel}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant="default"
              color="primary"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled || isSubmitting}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="flex gap-12">
        {/* Left: PAX Progress Indicator (vertical abstract) */}
        <nav
          aria-label="Progress"
          className="hidden md:block w-[280px] shrink-0 pt-2"
        >
          <ol className="flex flex-col gap-3">
            {steps.map((s) => {
              const isActive = currentStep === s.id
              const isDone = completedSteps.has(s.id)
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-1.5"
                  {...(isActive
                    ? { 'aria-current': 'step' as const }
                    : {})}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isDone ? (
                      <div className="w-4 h-4 rounded-full bg-content-secondary flex items-center justify-center">
                        <Check
                          width={10}
                          height={10}
                          className="text-white"
                        />
                      </div>
                    ) : isActive ? (
                      <div className="w-4 h-4 rounded-full border-2 border-content-secondary" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border-primary-main" />
                    )}
                  </div>
                  <span
                    className={`text-sm whitespace-nowrap ${
                      isActive
                        ? 'font-medium text-content-secondary'
                        : 'font-normal text-content-secondary'
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Right: form content */}
        <div className="flex-1 max-w-[512px]">
          {/* Mobile step indicator */}
          <div className="md:hidden mb-4">
            <p className="text-xs text-content-tertiary">
              Step {steps.findIndex((s) => s.id === currentStep) + 1} of{' '}
              {steps.length}
            </p>
          </div>

          {/* Step content */}
          {children}

          {/* ── Footer navigation ─────────────────────────────────────────── */}
          <div className="mt-10 pt-5 border-t border-border-primary-light flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-semibold text-content-tertiary hover:text-content-primary transition-colors cursor-pointer"
            >
              <ArrowLeft width={16} height={16} />
              {isFirstStep ? 'Cancel' : 'Go back'}
            </button>

            <Button
              variant="default"
              color="primary"
              onClick={onNext}
              disabled={!canAdvance || isSubmitting}
            >
              {isSubmitting ? submittingLabel : resolvedNextLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
