// ──────────────────────────────────────────────────────────────
// Propeller Provider Adapter Interfaces
// ──────────────────────────────────────────────────────────────
// Each provider adapter in libs/providers/<name> implements
// one of these interfaces. Providers are loaded dynamically
// at runtime from env, so adding a new provider is a
// drop-in lib + env var — no code changes in apps/workers.
// ──────────────────────────────────────────────────────────────

// ── Shared types ──

export interface ProviderInitOptions {
  /** Provider-specific configuration map (secrets + non-secrets) */
  config: Record<string, string>;
}

/** Every provider exposes this minimal lifecycle. */
export interface ProviderAdapter {
  readonly name: string;
  /** Healthcheck: true if the provider is reachable and authenticated. */
  healthcheck(): Promise<boolean>;
}

// ── Paystack: Virtual Account Provider ──

export interface PaystackChargeRequest {
  email: string;
  amount: number; // in kobo (minor unit)
  bank_transfer: {
    account_expires_at: string; // ISO 8601
  };
  metadata?: Record<string, string>;
}

export interface PaystackChargeResponse {
  reference: string;
  account_number: string;
  account_name: string;
  bank: { slug: string; name: string; id?: number };
  account_expires_at: string;
}

export interface PaystackWebhookPayload {
  event: string; // 'charge.success' | 'bank.transfer.rejected'
  data: Record<string, unknown>;
}

export interface VirtualAccountProvider extends ProviderAdapter {
  createCharge(req: PaystackChargeRequest): Promise<PaystackChargeResponse>;
  checkPendingCharge(reference: string): Promise<PaystackChargeResponse>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  parseWebhook(payload: PaystackWebhookPayload): PaystackWebhookEvent;
}

export type PaystackWebhookEvent =
  | { type: 'charge.success'; reference: string; amount: number; currency: string; senderName: string; senderBankAccount: string; senderCountry: string; paidAt: string }
  | { type: 'bank.transfer.rejected'; reference: string; amount: string; message: string; messageType: string };

// ── PayKKa: Merchant KYB Provider (Risk Assessment) ──
//
// We integrate PayKKa's *Risk Assessment* product, not the Onboarding product.
// Both share the same MerchOnboardCreateReq request body, but assessment/apply
// returns only a merch_id (no authorize_link) and the notify callback carries a
// status + risk_level — the right fit for our Merchant-of-Record model where we
// screen sub-merchants rather than have them authorize a PayKKa account.

export interface PayKKaOnboardRequest {
  request_id: string;
  contact_person: { phone_prefix: string; phone: string; email: string };
  license: PayKKaLicense;
  business: PayKKaBusiness;
  stakeholder_list: PayKKaStakeholder[];
  resident_address: PayKKaAddress;
}

export interface PayKKaLicense {
  region: string;
  ent_name: string;
  ent_name_en: string;
  found_date: string;
  registered_currency: string;
  registered_capital: number;
  address: PayKKaAddress;
}

export interface PayKKaBusiness {
  main_industry: string;
  sub_industry: string[];
  industry: number;
  employee_number: string;
  address: PayKKaAddress;
  export_country: string[];
  export_type: string[];
  trade_volume: string;
  website?: string;
  business_models?: string[];
}

export interface PayKKaStakeholder {
  identity_type: 'LEGAL_PERSON' | 'BENEFICIARY' | 'SHAREHOLDER' | 'DIRECTOR';
  name: string;
  nationality: string;
  birth_date: string;
  doc_type: 'ID_CARD' | 'HK_CARD' | 'PASSPORT' | 'MO_CARD' | 'HK_MO_PASS' | 'TW_CARD';
  id_number: string;
  doc_portrait_side_file_id: number;
  doc_address?: string;
  eff_date_start: string;
  eff_date_end?: string;
  long_term?: boolean;
  share?: number;
  resident_address: PayKKaAddress;
}

export interface PayKKaAddress {
  province?: string;
  city?: string;
  zipcode?: string;
  address1: string;
  address2?: string;
}

/** assessment/apply returns only a merch_id — no authorize_link. */
export interface PayKKaAssessmentResponse {
  merch_id: string;
}

/** Identity authentication status from the assessment notify/result. */
export type PayKKaAssessmentStatus =
  | 'INIT'      // initial
  | 'WAIT'      // pending review
  | 'PASS'      // review passed
  | 'REFUSED'   // review failed
  | 'AUTH_FAIL' // authorization canceled
  | 'REJECTED';

export type PayKKaRiskLevel = 'LOW' | 'MIDDLE' | 'HIGH';

/** Inner result payload shared by assessment/notify and assessment/result. */
export interface PayKKaAssessmentResult {
  request_id: string;
  merch_id: string;
  status: PayKKaAssessmentStatus;
  msg?: string;
  risk_level?: PayKKaRiskLevel;
}

/**
 * Body of the /api/v2/merch/assessment/notify webhook.
 * PayKKa wraps every callback in { type, version, data }.
 */
export interface PayKKaAssessmentNotification {
  type: 'ASSESSMENT' | 'MERCH' | string;
  version: string; // 'V1' | 'V2' | ...
  data: PayKKaAssessmentResult;
}

/** Inputs needed to verify an inbound PayKKa callback signature. */
export interface PayKKaCallbackVerifyInput {
  /** The request path PayKKa POSTed to (part of the canonical string). */
  path: string;
  /** merch_id from the X-Merch-Id header (empty string if absent). */
  merchId: string;
  /** The URL-encoded JSON Authorization header value. */
  signature: string;
  /** Raw request body, exactly as received. */
  rawBody: string;
}

export interface MerchantKybProvider extends ProviderAdapter {
  /** Upload a document file. Returns file_id for use in the assessment request. */
  uploadFile(fileName: string, fileData: Buffer): Promise<number>;
  /** Submit a merchant risk-assessment application. Returns the assigned merch_id. */
  submitAssessment(req: PayKKaOnboardRequest): Promise<PayKKaAssessmentResponse>;
  /** Query the current assessment result/status for a merch_id. */
  getAssessmentResult(merchId: string): Promise<PayKKaAssessmentResult>;
  /** Verify an inbound callback signature (RSA SHA256 against PayKKa's public key). */
  verifyCallbackSignature(input: PayKKaCallbackVerifyInput): boolean;
  /** Update an existing assessment application. */
  updateAssessment(merchId: string, req: Partial<PayKKaOnboardRequest>): Promise<void>;
}

// ── Dojah: Customer KYC Provider ──

export interface DojahSessionRequest {
  /** Business reference for this verification session. */
  reference: string;
  /** Email of the end-user being verified. */
  email: string;
  /** Optional: redirect URL after widget completion. */
  redirect_url?: string;
  /** Optional: supported ID types to restrict the widget. */
  allowed_id_types?: string[];
}

export interface DojahSessionResponse {
  reference_id: string;
  widget_token: string;
  public_key: string;
  expires_at: string;
}

export interface DojahWebhookPayload {
  reference_id: string;
  status: 'approved' | 'declined' | 'pending';
  verification_data: {
    full_name?: string;
    dob?: string;
    country?: string;
    doc_type?: string;
    doc_number_masked?: string;
    liveness_score?: number;
  };
}

export interface CustomerKycProvider extends ProviderAdapter {
  /** Create a new verification session (returns widget token). */
  createSession(req: DojahSessionRequest): Promise<DojahSessionResponse>;
  /** Query the result of a verification session. */
  getResult(referenceId: string): Promise<DojahWebhookPayload>;
  /** Verify a webhook signature. */
  verifyWebhookSignature(payload: string, signature: string): boolean;
}

// ── Globalstack (Passport): Off-Ramp Provider ──

export interface GlobalstackQuoteRequest {
  /** Source currency (e.g., 'USDC'). */
  source_currency: string;
  /** Target currency (e.g., 'NGN'). */
  target_currency: string;
  /** Source amount (optional — if omitted, target amount is used). */
  source_amount?: number;
  /** Target amount (optional — if omitted, source amount is used). */
  target_amount?: number;
}

export interface GlobalstackQuoteResponse {
  quote_id: string;
  rate: number;
  source_amount: number;
  target_amount: number;
  expires_at: string;
}

export interface GlobalstackOrderRequest {
  quote_id: string;
  /** Beneficiary bank account number. */
  account_number: string;
  /** Beneficiary bank code. */
  bank_code: string;
  /** Beneficiary name. */
  account_name: string;
  /** Idempotency key to prevent duplicate orders. */
  idempotency_key: string;
}

export interface GlobalstackOrderResponse {
  order_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface GlobalstackSettlementWebhook {
  order_id: string;
  status: 'completed' | 'failed';
  target_tx_hash?: string;
  target_amount?: number;
  target_currency?: string;
}

export interface OffRampProvider extends ProviderAdapter {
  /** Get a quote for a conversion. */
  getQuote(req: GlobalstackQuoteRequest): Promise<GlobalstackQuoteResponse>;
  /** Place an order for a conversion. */
  placeOrder(req: GlobalstackOrderRequest): Promise<GlobalstackOrderResponse>;
  /** Get the status of an order. */
  getOrderStatus(orderId: string): Promise<GlobalstackOrderResponse>;
  /** Verify settlement webhook signature. */
  verifyWebhookSignature(payload: string, signature: string): boolean;
}

// ── Passthrough Address Screening ──

export interface AddressScreeningRequest {
  address: string;
  city?: string;
  country: string;
  postal_code?: string;
}

export interface AddressScreeningResult {
  provider: string;
  decision: 'unscreened' | 'flagged' | 'cleared';
  raw: Record<string, unknown>;
  screened_at: string;
}

export interface AddressScreeningProvider extends ProviderAdapter {
  screenAddress(req: AddressScreeningRequest): Promise<AddressScreeningResult>;
}

// ── ComplyAdvantage: Sanctions Screening Provider ──

export interface ScreeningEntity {
  /** Entity name to screen */
  name: string;
  /** Optional: birth date for individuals (YYYY-MM-DD) */
  birthDate?: string;
  /** Optional: nationality ISO code */
  nationality?: string;
  /** Optional: ID document number */
  idNumber?: string;
  /** Optional: address */
  address?: string;
  /** Entity type */
  type: 'individual' | 'company';
}

export interface ScreeningHit {
  /** Hit ID from ComplyAdvantage */
  id: string;
  /** Matched entity name */
  name: string;
  /** Risk score (0-100) */
  riskScore: number;
  /** List types matched */
  lists: string[];
  /** Match types */
  matchTypes: string[];
  /** Raw provider response */
  raw: Record<string, unknown>;
}

export interface ScreeningResult {
  /** Overall decision */
  decision: 'cleared' | 'flagged' | 'unscreened';
  /** Risk score (0-100), highest across all hits */
  riskScore: number;
  /** Threshold used for decision */
  threshold: number;
  /** All hits found */
  hits: ScreeningHit[];
  /** Screening timestamp */
  screenedAt: string;
  /** Provider name */
  provider: string;
}

export interface ScreeningRequest {
  /** Business ID for audit trail */
  businessId: string;
  /** Entities to screen (stakeholders, business name, etc.) */
  entities: ScreeningEntity[];
  /** Optional: override default threshold (default 70) */
  threshold?: number;
}

export interface SanctionsScreeningProvider extends ProviderAdapter {
  /** Screen entities against sanctions lists */
  screen(req: ScreeningRequest): Promise<ScreeningResult>;
  /** Screen a single entity synchronously (convenience) */
  screenEntity(entity: ScreeningEntity, threshold?: number): Promise<ScreeningResult>;
}

// ── Provider Registry ──

/**
 * Types of providers that can be configured.
 * Values correspond to env var namespaces (e.g., PROVIDER_PAYSTACK_ENABLED=true).
 */
export const PROVIDER_TYPES = ['paystack', 'paykka', 'dojah', 'globalstack', 'passthrough_address', 'complyadvantage'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

/** Map provider type to its interface. */
export interface ProviderRegistry {
  paystack: VirtualAccountProvider;
  paykka: MerchantKybProvider;
  dojah: CustomerKycProvider;
  globalstack: OffRampProvider;
  passthrough_address: AddressScreeningProvider;
  complyadvantage: SanctionsScreeningProvider;
}
