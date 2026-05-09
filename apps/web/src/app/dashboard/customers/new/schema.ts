import { z } from 'zod'

// ─── Customer Type ──────────────────────────────────────────────────────────────

export type CustomerType = 'individual' | 'business'

// ─── Director form state ────────────────────────────────────────────────────────

export interface DirectorFormState {
  id: string
  firstName: string
  lastName: string
  middleName: string
  title: string
  gender: string
  nationalityCode: string
  phoneNumber: string
  dateOfBirth: string
  email: string
  idType: string
  idNumber: string
  idDocumentUrl: string
  issuingCountry: string
}

export const INITIAL_DIRECTOR: Omit<DirectorFormState, 'id'> = {
  firstName: '',
  lastName: '',
  middleName: '',
  title: '',
  gender: '',
  nationalityCode: '',
  phoneNumber: '',
  dateOfBirth: '',
  email: '',
  idType: '',
  idNumber: '',
  idDocumentUrl: '',
  issuingCountry: '',
}

// ─── Full form state ───────────────────────────────────────────────────────────

export interface FormState {
  // Step 1 – Customer type
  customerType: string

  // Individual – personal information
  firstName: string
  lastName: string
  middleName: string
  title: string
  gender: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  nationalityCode: string

  // Shared – address (individual or business)
  addressLineOne: string
  addressLineTwo: string
  postalCode: string
  countryCode: string
  stateCode: string
  city: string

  // Individual – identity & verification
  verificationType: string
  idType: string
  idNumber: string
  idDocumentUrl: string
  issuingCountry: string

  // Business – information
  registrationName: string
  businessPhone: string
  businessEmail: string

  // Business – identity (type is always 'cac')
  businessIdNumber: string
  businessIdUrl: string
  businessIssuingCountry: string

  // Common
  reference: string
}

export const INITIAL_FORM: FormState = {
  customerType: '',
  firstName: '',
  lastName: '',
  middleName: '',
  title: '',
  gender: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  nationalityCode: '',
  addressLineOne: '',
  addressLineTwo: '',
  postalCode: '',
  countryCode: '',
  stateCode: '',
  city: '',
  verificationType: '',
  idType: '',
  idNumber: '',
  idDocumentUrl: '',
  issuingCountry: '',
  registrationName: '',
  businessPhone: '',
  businessEmail: '',
  businessIdNumber: '',
  businessIdUrl: '',
  businessIssuingCountry: '',
  reference: '',
}

// ─── Validation ────────────────────────────────────────────────────────────────

export type FieldErrors = Record<string, string>

const phoneRegex = /^\+[1-9]\d{6,14}$/
const phoneMessage = 'Enter a valid phone number with country code (e.g. +2348012345678)'

function zodErrors(schema: z.ZodTypeAny, data: unknown): FieldErrors {
  const result = schema.safeParse(data)
  if (result.success) return {}
  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as string
    if (key && !errors[key]) errors[key] = issue.message
  }
  return errors
}

const individualInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required'),
  phoneNumber: z.string().min(1, 'Phone number is required').regex(phoneRegex, phoneMessage),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationalityCode: z.string().min(1, 'Nationality is required'),
})

const businessInfoSchema = z.object({
  registrationName: z.string().min(1, 'Registration name is required'),
  businessPhone: z.string().min(1, 'Phone number is required').regex(phoneRegex, phoneMessage),
})

const addressSchema = z.object({
  addressLineOne: z.string().min(1, 'Address is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  city: z.string().min(1, 'City is required'),
  stateCode: z.string().min(1, 'State is required'),
  countryCode: z.string().min(1, 'Country is required'),
})

const businessIdentitySchema = z.object({
  businessIdNumber: z.string().min(1, 'Registration number is required'),
  businessIssuingCountry: z.string().min(1, 'Issuing country is required'),
})

export const directorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  nationalityCode: z.string().min(1, 'Nationality is required'),
  phoneNumber: z.string().min(1, 'Phone number is required').regex(phoneRegex, phoneMessage),
  idType: z.string().min(1, 'ID type is required'),
  idNumber: z.string().min(1, 'ID number is required'),
  issuingCountry: z.string().min(1, 'Issuing country is required'),
})

export function validateDirector(
  director: Omit<DirectorFormState, 'id'>,
): FieldErrors {
  return zodErrors(directorSchema, director)
}

export function validateStep(
  stepNumber: number,
  customerType: string,
  form: FormState,
  directors?: DirectorFormState[],
): FieldErrors {
  if (stepNumber === 1) {
    if (!form.customerType) return { customerType: 'Please select a customer type' }
    return {}
  }

  if (customerType === 'individual') {
    if (stepNumber === 2) return zodErrors(individualInfoSchema, form)
    if (stepNumber === 3) return zodErrors(addressSchema, form)
    if (stepNumber === 4) {
      const errors: FieldErrors = {}
      const tier = getTierFromVerificationType(form.verificationType)
      if (tier === 'tier-2' || tier === 'tier-3') {
        if (!form.idType?.trim()) errors.idType = 'ID type is required'
        if (!form.idNumber?.trim()) errors.idNumber = 'ID number is required'
        if (!form.idDocumentUrl?.trim()) errors.idDocumentUrl = 'Identity document is required'
        if (!form.issuingCountry?.trim()) errors.issuingCountry = 'Issuing country is required'
      }
      return errors
    }
  }

  if (customerType === 'business') {
    if (stepNumber === 2) return zodErrors(businessInfoSchema, form)
    if (stepNumber === 3) return zodErrors(addressSchema, form)
    if (stepNumber === 4) return zodErrors(businessIdentitySchema, form)
    if (stepNumber === 5) {
      if (!directors || directors.length === 0) {
        return { directors: 'At least one director is required' }
      }
      return {}
    }
  }

  return {}
}

// ─── Tier helpers ───────────────────────────────────────────────────────────────

export type CustomerTier = 'tier-0' | 'tier-1' | 'tier-2' | 'tier-3'

export function getTierFromVerificationType(verificationType: string): CustomerTier {
  const map: Record<string, CustomerTier> = {
    'tier-0': 'tier-0',
    'tier-1': 'tier-1',
    'tier-2': 'tier-2',
    'tier-3': 'tier-3',
  }
  return map[verificationType] ?? 'tier-0'
}

