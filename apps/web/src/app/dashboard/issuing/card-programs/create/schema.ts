import { z } from 'zod'

// ─── Step 1: Type & Name ────────────────────────────────────────────────────────

export const step1Schema = z.object({
  type: z.enum(['physical', 'virtual'], {
    message: 'Select a card type',
  }),
  name: z
    .string()
    .min(1, 'Program name is required')
    .max(50, 'Program name must be 50 characters or less'),
})

// ─── Step 2: Program Details ────────────────────────────────────────────────────

export const step2BaseSchema = z.object({
  network: z.enum(['mastercard', 'visa', 'verve'], {
    message: 'Select a card network',
  }),
  currency: z.enum(['NGN', 'USD'], {
    message: 'Select a currency',
  }),
})

export function getStep2PhysicalSchema(isSandboxMode: boolean) {
  return step2BaseSchema.extend({
    binType: z.enum(['shared', 'dedicated']),
    bin: z.string().optional(),
    quantity: isSandboxMode
      ? z
          .string()
          .min(1, 'Estimated card quantity is required')
          .refine((v) => Number(v) >= 1 && Number(v) <= 5, 'Maximum quantity is 5 cards in sandbox')
      : z
          .string()
          .min(1, 'Estimated card quantity is required')
          .refine((v) => Number(v) >= 2000, 'Minimum quantity is 2,000 cards'),
  })
}

export const step2VirtualSchema = step2BaseSchema

/**
 * Returns the appropriate Step 2 schema based on card type.
 */
export function getStep2Schema(type: string, isSandboxMode = false) {
  return type === 'physical' ? getStep2PhysicalSchema(isSandboxMode) : step2VirtualSchema
}

// ─── Step 3: Authorization ──────────────────────────────────────────────────────

export const step3Schema = z
  .object({
    fundingSourceType: z.enum(['pool-account', 'card-account'], {
      message: 'Select a funding source type',
    }),
    poolAccount: z.string().optional(),
    settlementAccount: z
      .string()
      .min(1, 'Select an early refund account'),
    webhook: z.string().optional(),
    timeoutDefault: z.enum(['approve', 'decline']),
  })
  .refine(
    (data) =>
      data.fundingSourceType !== 'pool-account' ||
      (data.poolAccount && data.poolAccount.length > 0),
    {
      message: 'Select a pool account',
      path: ['poolAccount'],
    },
  )

// ─── Step 4: Personalization (physical only) ────────────────────────────────────

export const step4Schema = z.object({
  frontArtworkFile: z.string().optional(),
  defaultCardholderName: z
    .string()
    .min(1, 'Display name is required'),
})

// ─── Step 5: Distribution (physical only) ───────────────────────────────────────

export const step5Schema = z.object({
  distributionType: z.literal('bulked'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required'),
  addressLine1: z
    .string()
    .min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  country: z.string().min(1, 'Select a country'),
  state: z.string().min(1, 'Select a state'),
  city: z.string().min(1, 'Enter a city'),
})

// ─── Full form state type ───────────────────────────────────────────────────────

export interface FormState {
  // Step 1
  type: string
  name: string
  // Step 2
  network: string
  currency: string
  binType: string
  bin: string
  quantity: string
  // Step 3
  fundingSourceType: string
  poolAccount: string
  settlementAccount: string
  webhook: string
  timeoutDefault: string
  // Step 4
  frontArtworkFile: string
  defaultCardholderName: string
  // Step 5
  distributionType: string
  phoneNumber: string
  addressLine1: string
  addressLine2: string
  country: string
  state: string
  city: string
}

export const INITIAL_FORM: FormState = {
  type: '',
  name: '',
  network: '',
  currency: 'NGN',
  binType: 'shared',
  bin: '',
  quantity: '',
  fundingSourceType: 'pool-account',
  poolAccount: '',
  settlementAccount: '',
  webhook: '',
  timeoutDefault: 'approve',
  frontArtworkFile: '',
  defaultCardholderName: '',
  distributionType: 'bulked',
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  country: '',
  state: '',
  city: '',
}

// ─── Validation helpers ─────────────────────────────────────────────────────────

export type FieldErrors = Record<string, string>

/**
 * Validates a step and returns field-level errors.
 * Returns an empty object if validation passes.
 */
export function validateStep(
  stepNumber: number,
  form: FormState,
  isSandboxMode = false,
): FieldErrors {
  let schema: z.ZodType
  switch (stepNumber) {
    case 1:
      schema = step1Schema
      break
    case 2:
      schema = getStep2Schema(form.type, isSandboxMode)
      break
    case 3:
      schema = step3Schema
      break
    case 4:
      schema = step4Schema
      break
    case 5:
      schema = step5Schema
      break
    default:
      return {}
  }

  const result = schema.safeParse(form)
  if (result.success) return {}

  const flat = result.error.flatten() as {
    formErrors: string[]
    fieldErrors: Record<string, string[]>
  }
  const errors: FieldErrors = {}

  for (const [field, messages] of Object.entries(flat.fieldErrors)) {
    if (messages && messages.length > 0) {
      errors[field] = messages[0]
    }
  }

  // Catch top-level refinement errors and map them
  if (flat.formErrors && flat.formErrors.length > 0) {
    errors._form = flat.formErrors[0]
  }

  return errors
}

/**
 * Returns only the form fields relevant to a given step,
 * useful for building PATCH payloads.
 */
export function getStepFields(stepNumber: number): (keyof FormState)[] {
  switch (stepNumber) {
    case 1:
      return ['type', 'name']
    case 2:
      return ['network', 'currency', 'binType', 'bin', 'quantity']
    case 3:
      return [
        'fundingSourceType',
        'poolAccount',
        'settlementAccount',
        'webhook',
        'timeoutDefault',
      ]
    case 4:
      return ['frontArtworkFile', 'defaultCardholderName']
    case 5:
      return [
        'distributionType',
        'phoneNumber',
        'addressLine1',
        'addressLine2',
        'country',
        'state',
        'city',
      ]
    default:
      return []
  }
}
