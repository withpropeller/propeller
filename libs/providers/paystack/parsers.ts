import type { PaystackWebhookPayload, PaystackWebhookEvent } from '../../contracts/providers.js';

/**
 * Parse a Paystack webhook payload into a typed event.
 *
 * charge.success → maps sender info from authorization block
 * bank.transfer.rejected → maps reason from bank_transfer block
 */
export function parsePaystackWebhook(payload: PaystackWebhookPayload): PaystackWebhookEvent {
  const { event, data } = payload;

  if (event === 'charge.success') {
    const auth = data.authorization as Record<string, unknown> | undefined;
    return {
      type: 'charge.success',
      reference: data.reference as string,
      amount: data.amount as number,
      currency: (data.currency as string) ?? 'NGN',
      senderName: (auth?.sender_name as string) ?? 'unknown',
      senderBankAccount: (auth?.sender_bank_account_number as string) ?? 'unknown',
      senderCountry: (auth?.sender_country as string) ?? 'NG',
      paidAt: (data.paid_at as string) ?? (data.paidAt as string) ?? '',
    };
  }

  if (event === 'bank.transfer.rejected') {
    const bt = data.bank_transfer as Record<string, unknown>;
    return {
      type: 'bank.transfer.rejected',
      reference: (bt?.transaction_id as string) ?? '',
      amount: (bt?.amount as string) ?? '',
      message: (bt?.message as string) ?? 'Unknown rejection reason',
      messageType: (bt?.message_type as string) ?? '',
    };
  }

  throw new Error(`Unknown Paystack webhook event: ${event}`);
}
