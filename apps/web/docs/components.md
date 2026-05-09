# Components

## Current state

The app uses two categories of components: Pax design system components (imported from `@/lib/pax`) and custom components built to fill gaps or extend Pax patterns.

---

### Modal dialog standards

Every `ModalDialog` in this app follows these rules without exception:

| Rule | How |
|---|---|
| 4px gap between title and description | `<ModalDialogHeader className="gap-1">` (overrides Pax default `gap-2`) |
| Footer spacing when inside a `<form>` | `<ModalDialogFooter className="pt-6">` — the `<form>` wrapper breaks ModalDialogContent's `gap-6`, so `pt-6` restores it |
| Footer spacing without a `<form>` | No extra class needed — ModalDialogContent's `gap-6` applies directly |
| Buttons always show pointer cursor | Add `className="cursor-pointer"` to every `Button` in `ModalDialogFooter` |
| Supplementary field hints | Use an info tooltip (Pax `Tooltip` + `Info` icon from lucide-react) on the `FieldLabel`, not `FieldDescription` — keeps the form clean and the hint discoverable |

**Tooltip pattern for field hints:**
```tsx
<div className="flex items-center gap-1">
  <FieldLabel htmlFor="field-id">Label text</FieldLabel>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger type="button" className="text-content-tertiary hover:text-content-secondary transition-colors">
        <Info size={13} />
      </TooltipTrigger>
      <TooltipContent>Hint text here.</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>
```

Note: `type="button"` on `TooltipTrigger` prevents accidental form submission.

---

### Pax components in use

| Component | Where used |
|---|---|
| `Button` | All action buttons — primary, secondary, outline |
| `IconButton` | Topnav back button, table row actions, close buttons |
| `Breadcrumb` + `BreadcrumbList/Item/Link/Page/Separator` | Topnav breadcrumb trail |
| `Tabs` + `TabsList/Trigger/Content` | Section layout navigation, detail page sub-sections |
| `Table` + `TableHeader/Body/Row/Head/Cell/SelectHeader/SelectCell` | All data tables (via `DataTable` wrapper) |
| `Pagination` + `PaginationContent/Item/Previous/Next` | Table footers |
| `InputGroup` + `InputGroupAddon/Input` | Search inputs in filter toolbars |
| `Field` + `FieldLabel/Description/Error` | Form fields |
| `TextInput` | Form text fields |
| `Select` + `SelectTrigger/Value/Content/Item` | Form select dropdowns |
| `DropdownMenu` + `DropdownMenuTrigger/Content/Label/Separator/RadioGroup/RadioItem` | Filter dropdowns |
| `Alert` + `AlertDescription/AlertWarningIcon` | Sandbox mode banner |
| `Chip` | Base for `Badge` component (see below) |
| `Skeleton` | Table loading state |
| `toast` + `Toaster` | Toast notifications |
| `Tooltip` + `TooltipTrigger/Content/Provider` | Info tooltips on field labels |

---

### Custom components

#### `Badge` (`apps/web/src/components/ui/Badge.tsx`)

Wraps Pax `Chip` with semantic colour mapping. Callers pass a value string and variant; `Badge` determines the colour.

```tsx
<Badge value="active" variant="status" />   // → green chip
<Badge value="virtual" variant="type" />    // → neutral chip
<Badge value="approved" context="kyc" />    // → KYC-specific label mapping
```

Two variants:
- `variant="status"` — maps value to Pax semantic colour (success, error, warning, information, secondary) via `STATUS_COLOR`. Mapped values include: `success`/`successful`/`completed` → green; `pending` → blue; `failed`/`declined`/`blocked` → red; `inactive`/`cancelled` → grey; etc.
- `variant="type"` — always neutral secondary chip; used for descriptive classifications (card type, BIN type, etc.). If `value` is empty/null, renders `"No type"` as plain `text-content-tertiary` text (no chip).

The `context` prop supports domain-specific label overrides (e.g. `context="kyc"` maps raw API values to human-readable KYC status labels).

Labels are normalised: underscores and hyphens replaced with spaces, words capitalised. Non-breaking hyphens (`\u2011`) prevent label wrapping in narrow cells.

**Why this exists:** Pax `Chip` supports colour but requires callers to choose. Without a wrapper, different pages could render the same `active` status in different colours. `Badge` is the single source of truth for semantic colour. The card-programs page previously had its own local `STATUS_CHIP_COLOR` map; this was removed in favour of the shared `Badge` component.

#### `DataTable` (`apps/web/src/components/ui/DataTable.tsx`)

Wraps Pax `Table` with standard visual defaults, loading skeletons, empty state, row click handling, and pagination. Callers provide column definitions and data.

See `tables.md` for full specification.

**Why this exists:** Pax `Table` is a primitive — it provides the HTML structure but not the visual polish (rounded container, hover state, loading/empty states). `DataTable` defines the standard so every table in the app looks and behaves the same.

#### `GlobalPanel` (`apps/web/src/components/layout/GlobalPanel.tsx`)

Sliding right panel for entity detail views (accounts, customers, payments, etc.). Renders as a flex sibling to `<main>` — animates via `transition-[width]` to push the content area rather than overlaying it.

Contains per-entity panel components (`AccountDetail`, `CustomerDetail`, `TransactionPanel`, etc.). The `CustomerDetail` panel uses a local `SectionRow` sub-component (label + value, `dt`/`dd` pair) rather than the shared `PanelSection`/`PanelRow` — the panel's tighter layout requires different row proportions. `CustomerDetail` also fetches and renders the customer's linked accounts inline with balances.

See `layout.md` for structural details.

**Why this exists:** Pax doesn't have a push-panel component. The GlobalPanel is purpose-built for the dashboard's drill-down interaction model.

#### `AppShell` (`apps/web/src/components/layout/AppShell.tsx`)

Root layout wrapper that composes Sidebar, Topnav, GlobalPanel, and the main scroll area. Manages sidebar open/close state, panel close on route change, and mobile/tablet backdrop overlays.

#### `Topnav` (`apps/web/src/components/layout/Topnav.tsx`)

Breadcrumb + back button + mode toggle. Includes `ModeBadge` (internal sub-component) for the Sandbox/Live toggle. Built on Pax `Breadcrumb` and `IconButton`.

#### `PageHeader` (`apps/web/src/components/ui/PageHeader.tsx`)

Shared header for list pages. Props: `title` (string), `description` (optional string), `action` (optional ReactNode).

```tsx
<PageHeader
  title="Cards"
  description="Manage virtual and physical cards."
  action={<Button size="sm">Create card program</Button>}
/>
```

Layout: `flex items-start justify-between gap-4 mb-6`. Title: `text-2xl font-semibold text-content-primary leading-snug`. Description (when provided): `mt-1.5 text-sm text-content-tertiary max-w-prose`. Action slot: `shrink-0 flex items-center gap-2`.

Used on all section list pages. Not used on detail pages — those write their headers inline because of the variation in amount formatting, badge combinations, and action sets.

#### `FilterChip` (`apps/web/src/components/ui/FilterChip.tsx`)

Dismissible inline chip for active filter state. Props: `label`, `value`, `onRemove`.

Renders: `"Label: Value ×"` where the label is `text-content-quaternary` and the value is `text-content-secondary`. The `×` button is `w-5 h-5 rounded-md hover:bg-surface-tertiary`.

Style: `inline-flex items-center h-8 pl-2.5 pr-1 gap-1 text-xs font-medium rounded-lg border border-border-primary-light bg-surface-secondary`.

#### `CopyButton` (`apps/web/src/components/ui/CopyButton.tsx`)

Icon button that copies `text` to clipboard. Shows a `Check` icon (green, `text-feedback-success-main`) for 2 seconds after copy, then reverts to the `Copy` icon. Style: `hover:bg-surface-secondary rounded`.

#### `Switch` (`apps/web/src/components/ui/Switch.tsx`)

Custom toggle switch (not Pax). Props: `checked`, `onCheckedChange`, `disabled`, `className`, `id`. ARIA role `switch`. Colours: `bg-action-primary-main` when checked, `bg-border-primary-light` when off. Used on the card detail page for channel controls.

#### `SelectInput` (`apps/web/src/components/ui/SelectInput.tsx`)

Fully custom accessible select dropdown (not Pax `Select`). Props: `options` (value, label, description, icon, disabled), `value`, `onChange`, `placeholder`, `label`, `helperText`, `searchable`, `loading`, `emptyMessage`, `disabled`, `clearable`. Supports keyboard navigation (ArrowUp/Down, Enter, Escape). Dropdown uses `shadow-elevate animate-in fade-in slide-in-from-top-1`. Used on the card detail page for limit interval selection.

#### `Sparkline` (`apps/web/src/components/ui/Sparkline.tsx`)

Recharts `AreaChart`-based trend line. Props: `data` (array of `{day, value}`), `dataKey` (default `'value'`), `height` (default 90, or `'100%'`), `seriesLabel` (default `'USDC'`), `valueFormatter` (formats tooltip value). Renders a gradient fill area with a sky-blue line (`#38bdf8` — hardcoded data-viz exception, no semantic token for chart series). Includes a custom `SparkTooltip`. Shows a "No data" placeholder when the data array is empty. Used on the dashboard home page.

#### `Delta` (`apps/web/src/components/ui/Delta.tsx`)

Inline period-over-period change indicator. Props: `value` (number), `positiveIsGood` (default `true`), `unit` (default `'%'`), `context` (default `'vs previous period'`), `className`. Renders a `TrendingUp`/`TrendingDown` icon + formatted value. Colour: `text-feedback-success-dark` when good, `text-feedback-danger-dark` when bad. Used on the dashboard home page alongside sparkline stats.

#### `NetworkBadge` (`apps/web/src/components/ui/NetworkBadge.tsx`)

Displays a payment network logo (Mastercard, Visa, Verve) inside a Pax `Chip`. Props: `value` (network name string), `className`, `variant` ('light' | 'dark'), `showLabel`. Verve has separate light/dark SVG variants. Falls back to plain text for unknown networks.

#### `SectionLabel`, `PanelSection`, `PanelRow` (`apps/web/src/components/ui/PanelComponents.tsx`)

Three components for structured label/value display in detail pages and panels:

- **`SectionLabel`** — standalone section header with a hairline bottom border, optional tooltip and action button
- **`PanelSection`** — section header (`text-[15px] font-medium text-content-primary`) + `divide-y` children
- **`PanelRow`** — label + value row, `py-2.5`. Label: `text-sm text-content-tertiary shrink-0 min-w-32`. Value: `text-sm font-medium text-content-primary text-right`. Falls back to `—` for empty/null values.

#### `Sidebar` (`apps/web/src/components/layout/Sidebar.tsx`)

Fixed nav rail. Uses `NavItem` (internal) to render section links with active/inactive states. Collapsible at tablet breakpoint.

---

### Token rules

**Always use Pax tokens. Never hardcode colours or spacing values.**

All colours must reference design tokens:

```tsx
// Correct
className="text-content-primary bg-surface-secondary border-border-primary-light"

// Wrong
className="text-gray-900 bg-gray-50 border-gray-200"
```

All spacing uses Tailwind scale values that map to the Pax spacing system. Custom one-off values (e.g. `w-[240px]`) are acceptable for fixed-width UI constraints (search input widths, sidebar widths) but not for padding, margin, or gap values between content elements.

Hardcoded colours appear in two documented exceptions:
- Dark card visualisations (`from-[#121419] via-[#1a1c23] to-[#0a0c10]`) — card gradient requires specific dark values not available as semantic tokens
- Data visualisation series colours (`#38bdf8`, `#3EB4FF`, `#EC85C7`, `#43C66A`, `var(--fire-red-500)`, etc.) — Recharts SVG fill does not support CSS custom properties, so hardcoded hex values or CSS variable strings are used directly. Chart series colours are the only valid use case for non-token colour values in non-dark-card contexts.

---

### Gaps — what Pax doesn't have yet

| Need | Current solution |
|---|---|
| Semantic status badge | Custom `Badge` wrapping Pax `Chip` |
| Push panel / drawer | Custom `GlobalPanel` |
| Two-line table cells | Inline JSX pattern (not a component) |
| Full-page data table | Custom `DataTable` wrapping Pax `Table` |
| Toggle switch | Custom `Switch` |
| Searchable select | Custom `SelectInput` |
| Dismissible filter chip | Custom `FilterChip` |
| Copy-to-clipboard button | Custom `CopyButton` |
| Trend sparkline / area chart | Custom `Sparkline` (Recharts `AreaChart`) |
| Period-over-period delta indicator | Custom `Delta` |
| Network logo badge | Custom `NetworkBadge` |
| Section/row layout for metadata | Custom `SectionLabel`, `PanelSection`, `PanelRow` |

Most list pages use `DataTable`. The webhooks page uses a handwritten `<table>` because it requires inline edit/delete actions per row and a custom empty state with a CTA — patterns that don't fit `DataTable`'s column model cleanly. When Pax ships equivalents to these gaps, the custom components should be replaced or aligned.

## Decisions and rationale

**Why wrap Pax primitives rather than replacing them**
Pax components carry the design system's accessibility, theming, and token compliance. Wrapping them (rather than building from scratch) means updates to Pax tokens propagate automatically. The wrappers only add what Pax doesn't provide — semantics, composition, or visual defaults.

**Why `Badge` normalises labels**
API values are snake_case (`kyc_pending`, `not_started`). Rendering them raw would look unpolished. Normalisation happens once in `Badge`, not on every call site.

**Why `PageHeader` is used for list pages but not detail pages**
List pages have a uniform header shape (title + optional description + optional action button). Detail page headers vary significantly (financial amounts, multiple badge combinations, different action sets) — a single component would require too many props to be simpler than writing the header inline. `PageHeader` was extracted once the list-page pattern was stable.

## What good looks like

A new component is on-model if:
- It uses only Pax tokens for colour and semantic spacing
- It uses Pax primitives where they exist
- It has no colour or spacing values that would break in dark mode or on a different brand theme
- Its API is minimal — props for data and behaviour, not for visual overrides

A new page's table, badges, and buttons should be visually indistinguishable from existing pages without needing to inspect the source.

## Change log

- 2026-04-09 — Synced to current implementation: corrected `Sparkline` to Recharts `AreaChart` (not hand-rolled SVG); added `Delta` component; updated token rules section with chart color exceptions (Recharts SVG limitation); updated gaps table to note webhooks uses a handwritten table (not `DataTable`)
- 2026-04-09 — Documented `PageHeader` component (now exists); added `FilterChip`, `CopyButton`, `Switch`, `SelectInput`, `Sparkline`, `NetworkBadge`, `SectionLabel`/`PanelSection`/`PanelRow` as custom components; moved `Switch` from Pax table to custom; updated Pax gaps table; updated rationale for `PageHeader`
- 2026-04-09 — Badge: added `success`/`successful` status mappings; added "No type" fallback for empty type value; card-programs page migrated to shared `DataTable`; GlobalPanel `CustomerDetail` documented with `SectionRow` and linked accounts
- 2026-04-09 — Initial documentation written
