// ──────────────────────────────────────────────────────────────
// Propeller Event Contracts — shared between Go & TS
// ──────────────────────────────────────────────────────────────
// These event type strings are the canonical names used on
// flo streams. Go services publish/consume these; TS apps
// read these event shapes for UI/API responses.
// ──────────────────────────────────────────────────────────────

// ── Event type constants (keep in sync with Go contracts/events.go) ──

export const EventTypes = {
  // Webhook — raw inbound events (single stream, routed by flo pipeline)
  WebhookReceived: 'webhook.received',

  // Payment collection (Paystack PWT)
  PaymentReceived: 'payment.received',
  PaymentRejected: 'payment.rejected',
  PaymentCollected: 'payment.collected',

  // KYB (PayKKa onboarding)
  KybSubmitted: 'kyb.submitted',
  KybIdentityStarted: 'kyb.identity_started',
  KybIdentityPending: 'kyb.identity_pending',
  KybCompleted: 'kyb.completed',
  KybApproved: 'kyb.approved',
  KybRejected: 'kyb.rejected',
  KybManualReview: 'kyb.manual_review',

  // KYC (Dojah)
  KycCompleted: 'kyc.completed',

  // Payout (Globalstack off-ramp)
  PayoutRequested: 'payout.requested',
  PayoutDelivered: 'payout.delivered',
  PayoutSettled: 'payout.settled',
  PayoutFailed: 'payout.failed',

  // Business lifecycle
  BusinessActivated: 'business.activated',
  BusinessSuspended: 'business.suspended',
  BusinessClosed: 'business.closed',

  // Ledger
  LedgerCredited: 'ledger.credited',
  LedgerDebited: 'ledger.debited',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// ── Action names (flo action handlers) ──

export const ActionNames = {
  ReceivePayment: 'receive-payment',
  RejectPayment: 'reject-payment',
  SubmitKyb: 'submit-kyb',
  CompleteKyb: 'complete-kyb',
  CompleteKyc: 'complete-kyc',
  RoutePayout: 'route-payout',
  DeliverPayout: 'deliver-payout',
  SettlePayout: 'settle-payout',
  FailPayout: 'fail-payout',
  ActivateBusiness: 'activate-business',
  DebitLedger: 'debit-ledger',
  CreditLedger: 'credit-ledger',
} as const;

export type ActionName = (typeof ActionNames)[keyof typeof ActionNames];

// ── Stream names ──

export const StreamNames = {
  RawWebhooks: 'raw-webhooks',
  PaymentEvents: 'payment-events',
  KybEvents: 'kyb-events',
  KycEvents: 'kyc-events',
  PayoutEvents: 'payout-events',
  BusinessEvents: 'business-events',
  LedgerEvents: 'ledger-events',
} as const;

// ── Event payload shapes ──

export interface WebhookRecord {
  source: 'paystack' | 'paykka' | 'dojah' | 'globalstack';
  event: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  receivedAt: string;
  idempotencyKey: string;
}

export interface PaymentReceivedEvent {
  provider: 'paystack';
  reference: string;
  amount: number; // kobo
  currency: string;
  senderName: string;
  senderBankAccount: string;
  senderCountry: string;
  paidAt: string;
  paymentRequestId: string;
}

export interface PaymentRejectedEvent {
  provider: 'paystack';
  reference: string;
  amount: string;
  message: string;
  messageType: string;
}

export interface KybCompletedEvent {
  provider: 'paykka';
  merchId: string;
  status: 'APPROVED' | 'REJECTED' | 'SUPPLEMENT';
  message?: string;
}

export interface KycCompletedEvent {
  provider: 'dojah';
  referenceId: string;
  status: 'approved' | 'declined' | 'pending';
  fullName?: string;
  dob?: string;
  country?: string;
  docType?: string;
  livenessScore?: number;
}

export interface PayoutSettledEvent {
  provider: 'globalstack';
  orderId: string;
  targetTxHash?: string;
  targetAmount?: number;
  targetCurrency?: string;
}

export interface LedgerEntry {
  accountId: bigint;
  accountType: string;
  amount: bigint;
  direction: 'debit' | 'credit';
  transferId: bigint;
  businessId: string;
}
