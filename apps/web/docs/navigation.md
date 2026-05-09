# Navigation

## Current state

Navigation uses three systems: the sidebar (primary), the topnav breadcrumb (context/location), and in-page tabs (sub-section switching within a detail page).

### Sidebar

Fixed left rail. Collapses to icon-only at tablet breakpoint (`md:w-14`), expands to full labels at desktop (`lg:w-56`). Background: `bg-(--midnight-100)`.

The sidebar has two types of nav entries:

**Standalone items** — direct links with no children. Top-level standalone items: Dashboard, Customers, Accounts, Disputes. Standalone items can also appear inside a section (e.g. Payments under `PRODUCTS`) when a product has no sub-sections.

**Collapsible parent items** — grouped under a section label, expand to reveal child links on click. Two sections:
- `PRODUCTS`: Issuing (→ Card programs, Cards, Authorizations, BINs, Transactions), Payments (standalone, → `/dashboard/payments`)
- `ADMIN`: Developer (→ Webhooks, Events, API keys, Logs), Settings (→ Profile, Business identity, Team, Security)

Parent items show a `ChevronDown` icon that rotates when expanded. Child items indent with `pl-9`.

**Active item style** (standalone and child items):
```
bg-surface-secondary text-content-primary font-semibold
```

**Inactive item style:**
```
text-content-tertiary hover:bg-surface-secondary/60 hover:text-content-secondary
```

Active parent items (when a child is active or the parent is open) use `text-content-primary` without a background fill — the background only appears on the specific active child.

At tablet (collapsed), section labels are replaced by a hairline divider. Parent labels and chevrons are hidden. On tablet-expanded (manually toggled), the full label layout is restored.

The user section at the bottom of the sidebar shows an avatar, business name, and email. Clicking opens a popup menu with "Account settings" (links to `/dashboard/settings/profile`) and "Log out".

### Breadcrumb

The Pax `Breadcrumb` component renders inside the topnav. Behaviour differs by page type:

**List pages** (root-level, e.g. `/dashboard`, `/dashboard/accounts`, `/dashboard/customers`):
- Renders only the page name as a non-linked `BreadcrumbPage`
- Example: `Dashboard`, `Accounts`
- No back button

**Section pages** (sub-section list, e.g. `/dashboard/issuing/cards`, `/dashboard/developer/api-keys`):
- Renders section → subsection: `Section / Subsection`
- Example: `Issuing / Cards`, `Developer / API keys`
- Section is a `BreadcrumbLink` to the section root; subsection is `BreadcrumbPage`
- No back button

**Detail pages** (entity-level, e.g. `/dashboard/issuing/cards/crd_xxx`):
- Renders the full ancestry trail: Section → Subsection → Page title
- Example: `Issuing / Cards / Visa •••• 4242`
- Back button (`ArrowLeft` IconButton, `variant="ghost" color="secondary" size="sm"`) appears to the left of the breadcrumb
- Clicking back calls `router.back()` — navigates to whatever the browser history entry was

**Breadcrumb parent lookup**
The `DETAIL_PARENTS` map in `Topnav.tsx` defines the ancestry for each detail route. The `SECTION_LABELS` map covers section-level pages. The `LIST_LABELS` map covers root-level pages.

The page title segment (`BreadcrumbPage`) is sourced from `IssuingNavContext.pageTitle` — detail pages set this via `useIssuingNav().setPageTitle(...)` with the entity name/ID.

**Truncation**: The `BreadcrumbPage` (current page title) truncates at `max-w-48` to prevent very long names from overflowing the topnav.

### Mode toggle

A `ModeBadge` button sits at the far right of the topnav on every dashboard page. It shows the current environment:

- **Sandbox**: amber pill with warning dot — `border-feedback-warning-border bg-feedback-warning-light text-feedback-warning-dark`
- **Live**: neutral pill with green dot — `border-border-primary-light bg-surface-secondary text-content-secondary`

Clicking it toggles the mode, persists to the user profile via `updateProfile`, and re-renders the entire dashboard data layer with the new mode.

The mode toggle does **not** appear in the sidebar, inline on pages, or inside section headers. It is topnav-only.

### In-page tabs

Tabs are used only at the detail page level to switch between content panels (Details, Transactions, Audit trail, etc.). There are no section-level tabs in any layout file — each list page owns its own `PageHeader` with title and action button.

Detail-level tabs:
- Use Pax `Tabs`, `TabsList`, `TabsTrigger`
- Render within the detail page body, below the page header
- First tab (e.g. Details) is active by default

## Decisions and rationale

**Why breadcrumbs instead of a page title only**
A page title alone doesn't tell the user how they got here or how to navigate up. Breadcrumbs make the hierarchy explicit and provide clickable escape hatches. This matters most on detail pages reached by deep-linking or after multiple navigations.

**Why the back button calls `router.back()` rather than a hardcoded parent link**
Users often arrive at detail pages from different contexts (list page, global panel, search). Hardcoding a parent path would always send them to the list even if they came from somewhere else. `router.back()` preserves that context.

**Why the mode toggle lives only in the topnav**
The mode toggle affects the entire session, not just one screen. Putting it in the topnav — the same horizontal band on every page — makes it always findable without being visually noisy. Sidebar placement was rejected because the sidebar is already crowded with section links and the mode toggle is not navigation. Inline page placement was rejected because it would need to appear on every page and isn't page-specific.

**Why each list page owns its PageHeader instead of a shared layout header**
Section layouts (issuing, payments, developer) are pass-throughs. Individual pages own their title and primary action button via the `PageHeader` component. This avoids the coordination overhead of a shared layout header that needs to know about each child page's action buttons.

**Why collapsible parents instead of always-expanded or icon-only**
Collapsible parents let users focus on the section they're working in without losing awareness of other sections. At tablet width, the icon rail gives quick access with minimal width.

## What good looks like

A user at any point in the app should be able to:
1. Know which section they're in (breadcrumb / sidebar active state)
2. Know which environment they're in without reading a warning banner (mode toggle always visible)
3. Navigate up one level with a single click (back button or breadcrumb link)
4. Return to the list with a single click (subsection breadcrumb link)

The Issuing card detail page is the reference benchmark: `Issuing / Cards / Visa •••• 4242` in the breadcrumb, back button to return to the cards list, mode badge in the top-right corner. No other wayfinding elements are needed.

## Change log

- 2026-04-10 — Removed `Requests` and `Payouts` sub-nav items; `Payments` is now a standalone link (inside the `PRODUCTS` section) that points directly to `/dashboard/payments`. The sub-routes `/dashboard/payments/all`, `/dashboard/payments/requests`, `/dashboard/payments/payouts` no longer exist — the payments list now lives at `/dashboard/payments`.
- 2026-04-09 — Synced to current implementation: verified accurate against Sidebar.tsx and Topnav.tsx — no structural changes found
- 2026-04-09 — Fixed active item style (`bg-surface-secondary font-semibold`); fixed inactive hover style; replaced section-level layout tabs description with per-page PageHeader model; expanded sidebar description; added three-tier breadcrumb categories
- 2026-04-09 — Sentence case enforced on all nav/tab labels: "API Keys" → "API keys", "Business Details" → "Business details", "All Payments" → "All payments", "New Payout" → "New payout"
- 2026-04-09 — Initial documentation written
