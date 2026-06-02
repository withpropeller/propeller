import type { ApiHydratedBusinessKYC, ApiHydratedBusinessKYCStatus } from '@/api/model'

/** KYC has been submitted for review or already approved. */
export function isKycSubmitted(status?: ApiHydratedBusinessKYCStatus): boolean {
  return status === 'submitted' || status === 'approved'
}

/** KYC is awaiting operator review. */
export function isKycUnderReview(kyc?: ApiHydratedBusinessKYC): boolean {
  return kyc?.status === 'submitted'
}

/** Treat submitted/approved KYC as complete for dashboard verification UI. */
export function isKycVerifiedForBusiness(kyc?: ApiHydratedBusinessKYC): boolean {
  return kyc?.status === 'approved' || kyc?.status === 'submitted'
}

export function extractKycFromResponse(kycData: unknown): ApiHydratedBusinessKYC | undefined {
  const raw =
    (kycData as { data?: { data?: unknown } })?.data?.data ??
    (kycData as { data?: unknown })?.data
  if (!raw || typeof raw !== 'object') return undefined
  return raw as ApiHydratedBusinessKYC
}
