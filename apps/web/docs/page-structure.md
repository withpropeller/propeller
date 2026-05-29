# Page Structure

## Current state

Pages follow one of three patterns: **the dashboard home**, **list pages**, and **detail pages**.

---

### Dashboard home (`/dashboard`)

A standalone analytics page. Does not follow the list or detail pattern.

Structure:
1. **Greeting header** — time-of-day greeting + business name, period selector
2. **Row 1 — Collections card** — pay-in volume, `Delta`, `Sparkline`; side stats: successful pay-ins, failed pay-ins, success rate
3. **Row 2 — `grid grid-cols-1 lg:grid-cols-3`** — Pay-in vs pay-out donut, payments by status, available balance + pending payout

Data from `GET /dashboard/metrics` via gateway (`useDashboardControllerGetMetrics`). Sub-components (`ChartCard`, `ChartTooltip`) are defined inline in `dashboard/index.tsx`.

Charts use Recharts: `AreaChart` (via `Sparkline`), `BarChart`, `PieChart`. Chart colour palette hardcoded (`#3EB4FF`, `#EC85C7`, `#43C66A`, etc.) — see `components.md` token rules for the data-viz exception.

---

### List pages

Structure:
1. **Page header** — rendered by the page itself via the `PageHeader` component
2. **Stats bar** (on some pages) — summary metrics above the filter toolbar
3. **Filter toolbar** — search + filters + active chips
4. **DataTable** — with empty state, loading state, and pagination

#### Stats bar

An optional horizontal strip between the page header and filter toolbar. Not all list pages have one — it appears on pages where aggregate summary metrics are useful at a glance.

Pages with a stats bar: Accounts, Customers, Disputes, Cards.

Style: `bg-surface-primary border border-border-primary-light rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-start gap-4 md:gap-8`

Each stat is a label + value pair:
- Label: `text-xs font-medium text-content-tertiary mb-2`
- Value: `text-xl font-semibold text-content-primary tabular-nums leading-none`
- Dividers between stats: `h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0`

Stats on the Cards and Disputes pages are currently placeholder values with `// TODO: wire to API`.

#### PageHeader component

`PageHeader` (`apps/web/src/components/ui/PageHeader.tsx`) is a shared component used on all list pages. Props:

```ts
{
  title: string
  description?: string
  action?: ReactNode
}
```

Layout: `flex items-start justify-between gap-4 mb-6`

- Title: `text-2xl font-semibold text-content-primary leading-snug`
- Description (optional): `mt-1.5 text-sm text-content-tertiary max-w-prose`
- Action (optional): right-aligned, shrink-0, `flex items-center gap-2`

The action slot holds the primary CTA for that page (e.g. "Create card program"). Secondary controls like export belong in the filter toolbar, not the action slot.

Section layouts for Issuing, Payments, and Developer are pass-throughs (`<>{children}</>`). Each list page renders its own `PageHeader` directly. The Settings layout is the exception — it renders a section title and a left-nav sidebar shared across settings sub-pages.

---

### Detail pages

Structure:
1. **Page header** — title, status badge, action buttons
2. **Overview strip** (when applicable) — horizontal key-metadata row
3. **Body layout** — typically a sidebar column + main column (`grid grid-cols-1 lg:grid-cols-3`)
4. **Sidebar column** — snapshot card(s), contextual links, key identifiers
5. **Main column** — tabs for Details, Transactions, Audit trail, etc.

#### Page header

```
[Title]     [Status badge]     [Action buttons]
```

- Title: entity name or identifier — `text-2xl font-semibold text-content-primary leading-snug`
- For financial entities (transactions, authorizations): amount as `text-2xl font-bold tracking-tight`, currency prefix slightly smaller and `opacity-40`
- Status badge: Pax-based `Badge` component, `variant="status"`, always to the right of title
- Secondary badges (e.g. dispute status) may appear after the status badge
- Action buttons: right-aligned, `size="sm"`, typically `variant="outline" color="secondary"` for secondary actions

Detail page headers are written inline, not via the `PageHeader` component, because financial amounts, badge combinations, and action sets vary enough that a shared component would need too many props.

#### Overview strip

A horizontal row of key metadata rendered above the body grid. Used on transaction and authorization detail pages. Contains: amount, merchant, card last 4, date, and similar summary fields. Allows the user to understand the entity without scrolling.

No card wrapper or border — fields sit directly in the flow with `space-x-8` or similar.

#### Body layout

Three-column grid (`lg:grid-cols-3`):
- Sidebar: `lg:col-span-1` — snapshot card, identification info, links to related entities
- Main: `lg:col-span-2` — tabbed deep content

On mobile the grid collapses to single column, sidebar above main.

#### Snapshot cards

The sidebar typically contains one or two "snapshot" cards:
- Primary snapshot: `bg-surface-primary rounded-2xl p-6 border border-border-primary-light shadow-whisper`
- Inner metadata block: `p-4 bg-surface-secondary/50 rounded-xl`
- Dark "identity" card (for card visualizations, BIN metadata): `bg-linear-to-br from-[#121419] to-[#0a0c10] border border-white/5 rounded-2xl`

#### Sections and label/value rows

Sections within detail pages use `PanelSection` + `PanelRow` (custom components). These render flat label/value pairs:

```
Label     Value
Label     Value
───────────────
Label     Value
```

- Label: `text-sm text-content-tertiary` — real sentence-case labels (not all-caps)
- Value: `text-sm font-medium text-content-primary`
- Dividers: hairline `divide-y` between rows
- No card or box wrapper around section groups — fields are open in the layout

**All-caps muted labels were rejected.** The pattern of `TEXT-XS UPPERCASE TRACKING-WIDE` for labels was considered and dropped. Real sentence-case headings are more readable and don't signal "metadata" vs. "content" in a way that's useful here.

#### Section headings

Section headings within detail pages use `text-[15px] font-medium text-content-primary`. Not uppercase, not muted. They are honest headings, not decorative separators.

**Exception — GlobalPanel compact sections:** The `CustomerDetail` panel uses `text-[10px] uppercase font-bold text-content-tertiary tracking-widest` for section group labels ("Profile", "Accounts"). This is an intentional exception for the constrained panel context where vertical space is tight and visual separation between groups matters more than heading legibility. This pattern should not be adopted in full-page layouts.

#### Unconfigured vs. empty fields

| State | Visual treatment |
|---|---|
| Field is unconfigured (user action needed) | Amber text + inline `Configure` link |
| Field is intentionally absent / not applicable | `—` (em dash) in `text-content-tertiary` |
| Optional field the user could fill in | `—` + inline `Add` link in `text-action-primary-main` |

Unconfigured fields are distinguished from empty fields by colour: amber signals "attention required", not just absence of data.

#### Inline sections with record limits

Related records (e.g. recent transactions on a card detail page) are rendered inline within a tab, with a row limit (typically 5–10) and a "View all" link to the full list. Separate tabs are used for full browsing.

## Decisions and rationale

**Why `font-semibold leading-snug` instead of `font-bold tracking-tight`**
`font-bold` headings were visually heavy relative to the surrounding content weight. `font-semibold` at the same size reads clearly as a heading without dominating. `leading-snug` replaces `tracking-tight` because the visual tightness should come from line-height (relevant for multi-line titles) rather than letter-spacing compression.

**Why the section header lives in the page, not the layout**
Section layouts are pass-throughs. Each list page owns its `PageHeader` with its own title and action button. This avoids the coordination overhead of a shared layout that needs to know about every child page's action button. The `PageHeader` component provides consistency without a shared layout.

**Why `PageHeader` is used for list pages but not detail pages**
List page headers are structurally similar (title + optional description + optional action). Detail page headers vary significantly — financial amounts, multiple badge types, different action sets — making a shared component harder to justify. The component is extracted when the pattern is stable, not pre-emptively.

**Why three-column grid for detail pages**
Two-column layouts at this content density tend to make either the label column too wide or the value column too narrow. Three columns give the sidebar enough room to display a snapshot card while the main area (two columns of the three) has adequate space for tabbed content.

**Why flat label/value rows instead of cards per group**
Card wrappers for every field group add visual weight without adding meaning. The content is metadata, not interactive UI. Flat rows with hairline dividers communicate grouping adequately and keep the page feeling open rather than boxed.

**Why sentence-case section headings instead of all-caps labels**
All-caps small labels (`CARD DETAILS`, `BILLING`) are a common but accessibility-unfriendly pattern that signals "this is a secondary label" rather than a navigable heading. Real section headings at appropriate weight are more legible, pass WCAG contrast more easily, and don't require the reader to mentally decode the case convention.

**Why amber for unconfigured, not an inline banner**
An inline banner would be too visually heavy for a field that may only occasionally be unconfigured. Amber text + `Configure` link communicates "this needs attention" at exactly the right scope — one field — without dominating the page.

## What good looks like

A detail page (e.g. a card or transaction) should read top-to-bottom without requiring any interaction to see the most important information:

1. Amount / title + status visible immediately in the header
2. Key metadata (card, merchant, date) visible in the sidebar snapshot card without scrolling
3. First tab (Details) active by default — showing field/value pairs in flat rows
4. Section headings clearly delineate logical groups
5. Any unconfigured fields show amber + Configure without needing a tooltip or modal to understand what's wrong

The Issuing transaction detail page is the reference benchmark.

## Change log

- 2026-04-09 — Synced to current implementation: documented dashboard home as a third page pattern (greeting + volume card + chart grid); added stats bar pattern for list pages (Accounts, Customers, Disputes, Cards); corrected dashboard layout (Row 1 = volume card + sparkline + approved/declined/success, Row 2 = 4-col grid: spend bar, channel donut, decline reasons)
- 2026-04-09 — Dashboard home redesigned: Your accounts, Recent transactions, and Needs attention sections replaced with Row 1 transaction volume + sparkline, Row 2 chart grid. All using placeholder data. `ChartCard` and `SpendBarsChart` defined inline in `dashboard/page.tsx`.
- 2026-04-09 — Synced to current implementation: documented `PageHeader` component (it now exists at `components/ui/PageHeader.tsx`); updated list page structure to reflect per-page ownership (not layout); corrected `PanelSection` section heading style to `text-[15px] font-medium`; removed stale "section header lives in the layout" rationale
- 2026-04-09 — Page heading style changed from `font-bold tracking-tight` to `font-semibold leading-snug` across all sections; GlobalPanel compact section label exception documented
- 2026-04-09 — Initial documentation written
