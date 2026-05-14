import type { DocSection } from "./nav";

export const DOCS_SECTIONS: DocSection[] = [
  {
    title: "Get started",
    links: [
      { href: "/", label: "Welcome" },
      { href: "/quickstart", label: "Quickstart" },
      { href: "/authentication", label: "Authentication" },
      { href: "/first-request", label: "First API call" },
    ],
  },
  {
    title: "Concepts",
    links: [
      { href: "/concepts/ledger", label: "Ledger & accounts" },
      { href: "/concepts/payments", label: "Payment collection" },
      { href: "/concepts/payouts", label: "Payouts & settlement" },
      { href: "/concepts/compliance", label: "Compliance & KYC" },
      { href: "/concepts/errors", label: "Errors & retries" },
    ],
  },
  {
    title: "API reference",
    links: [
      { href: "/api/businesses", label: "Businesses" },
      { href: "/api/invoices", label: "Invoices" },
      { href: "/api/payments", label: "Payments" },
      { href: "/api/payouts", label: "Payouts" },
      { href: "/api/webhooks", label: "Webhooks" },
    ],
  },
  {
    title: "Guides",
    links: [
      { href: "/guides/onboarding", label: "Onboarding a business" },
      { href: "/guides/collecting-payments", label: "Collecting payments" },
      { href: "/guides/payout-flow", label: "Payout flow" },
      { href: "/guides/reconciliation", label: "Reconciliation" },
      { href: "/guides/webhooks", label: "Webhook integration" },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/ops/webhooks", label: "Webhooks" },
      { href: "/ops/idempotency", label: "Idempotency" },
      { href: "/ops/rate-limits", label: "Rate limits" },
      { href: "/ops/status", label: "Status & uptime" },
    ],
  },
];
