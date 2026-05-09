# Topnav

## Current state

The topnav is a sticky horizontal bar that appears at the top of every dashboard route. It is defined in `Topnav.tsx` and rendered inside `AppShell.tsx`.

### Visual structure

```
[Back button]  [Breadcrumb trail]                [Mode badge]
```

Height: `h-14` (56px)
Background: `bg-surface-primary`
Bottom border: `border-b border-border-primary-light`
Internal padding: `px-4 md:px-8`

The topnav uses `flex items-center justify-between gap-4`:
- Leading group: back button (when applicable) + breadcrumb
- Trailing: mode badge

### Positioning

The topnav is sticky within the main scroll container (`sticky top-0 z-10`), wrapped in a `<div className="sticky top-0 z-10">` inside `<main>`. It is not fixed to the viewport. This means:
- It stays at the top of the visible scroll area
- It moves with the layout shift when GlobalPanel opens (because it's inside the `<main>` flex container)
- On mobile (`md:hidden`), `MobileTopBar` renders instead — a dark bar (`bg-[#0a0a0b]`, `h-12`) with a hamburger button, centred brand name, and search button

### Content

**What lives in the topnav:**
- Breadcrumb (always)
- Back button (detail pages only)
- Mode toggle / ModeBadge (always)

**What does not live in the topnav:**
- Section headings / page titles (those are in the page/layout body)
- Navigation tabs (those are below the topnav in the layout)
- Action buttons (those are in the page header)
- Search or filters (those are in the filter toolbar above the table)
- Notifications or user account controls (not implemented in topnav)

### Breadcrumb modes

The topnav renders one of three breadcrumb structures depending on the current route:

1. **List pages** (`/dashboard`, `/dashboard/accounts`, `/dashboard/customers`, `/dashboard/disputes`, `/dashboard/payments`): single non-linked `BreadcrumbPage` — no back button
2. **Section pages** (e.g. `/dashboard/issuing/cards`, `/dashboard/developer/api-keys`): `Section / Subsection` where Section is a link — no back button
3. **Detail pages** (e.g. `/dashboard/issuing/cards/crd_xxx`): `Section / Subsection / Page title` with all ancestors as links — back button visible

The page title for detail pages comes from `IssuingNavContext.pageTitle`, set by each detail page via `useIssuingNav().setPageTitle(...)`. It truncates at `max-w-48`.

### Padding alignment with content

The content below the topnav uses `lg:p-16` (64px). The topnav uses `px-4 md:px-8` — previously `md:px-16`, reduced to `md:px-8` to close the alignment gap slightly and prevent the breadcrumb from sitting too far from the left edge on tablet.

At large viewports, there is a deliberate gap between the topnav's left edge and the content column's left edge (because `lg:p-16` >> `md:px-8`). This is intentional: the topnav reads as a full-width chrome element, not as part of the content column. The breadcrumb's visual weight is light enough that the misalignment doesn't read as a layout error.

If content were ever pushed to wider viewports where the `max-w-[1200px]` constraint doesn't bind, the topnav padding may need revisiting.

### Mode badge

The `ModeBadge` is a `<button>` element (not a link) anchored to the trailing end of the topnav. See `navigation.md` for full specification.

It is always visible, always in the same position, on every dashboard page. This is intentional — users should be able to glance at the top-right corner to know their current mode without needing to look for it.

### Back button

A Pax `IconButton` (`variant="ghost" color="secondary" size="sm"`) with an `ArrowLeft` icon. Only appears when `isDetailPage` is `true` — meaning the current route is neither a list page (`LIST_LABELS`) nor a section page (`SECTION_LABELS`). Section pages (e.g. `/dashboard/issuing/cards`) are not list pages but do not show the back button. Calls `router.back()`.

The button sits to the left of the breadcrumb, inside the leading flex group. It does not push the breadcrumb visually because both are in a `flex items-center gap-1` container — the breadcrumb shifts right slightly when the button appears, which is acceptable given back button + breadcrumb always appear together.

## Decisions and rationale

**Why the topnav appears on every dashboard page, not just detail pages**
A topnav that only appears on some pages creates an inconsistent chrome. Users would notice its absence on list pages. More importantly, the mode toggle needs to be always accessible — if the topnav were absent on list pages, the mode toggle would need to move to the sidebar or the page header, which have different problems (see `navigation.md`).

**Why `sticky` instead of `fixed`**
`fixed` positioning would require the main content to have `padding-top: 56px` to avoid being obscured. Sticky within the scroll container avoids this. It also means the topnav participates correctly in the flex layout alongside GlobalPanel — a fixed topnav would layer over the panel.

**Why internal padding doesn't exactly match `lg:p-16`**
The topnav is chrome, not content. Aligning it exactly with the content column would make it look like it's part of the content rather than a structural band. The slight inset (`px-8` vs. `p-16`) preserves the visual separation between "this is the app frame" and "this is page content".

**Why the topnav doesn't contain page titles or action buttons**
Page titles are owned by their pages. Putting them in the topnav would require every page to communicate its title upward (via context or query) and would limit layout flexibility (e.g. page titles that appear alongside badges or action buttons). The topnav owns breadcrumbs (location in the hierarchy) and mode (session state), nothing else.

## What good looks like

The topnav should feel like a continuous horizontal band that connects to the content below it — not a floating bar or a modal chrome element.

Correct:
- The topnav border-bottom reads as a single horizontal separator between navigation chrome and page content
- The mode badge is instantly findable at the top-right corner on any page
- The back button appears/disappears without the breadcrumb appearing to jump (gap-1 layout absorbs it)
- On detail pages, breadcrumb shows full ancestry (e.g. `Issuing / Cards / Visa •••• 4242`)

Incorrect:
- Topnav without a bottom border — it floats instead of sitting as a band
- Mode badge anywhere other than top-right
- Page title appearing in both the topnav and the page header simultaneously
- Topnav absent on list/root pages

## Change log

- 2026-04-10 — `/dashboard/payments` moved from the Section-page category to the List-page category after Requests/Payouts were removed. Payments now breadcrumbs as a single `Payments` entry, not `Payments / All payments`.
- 2026-04-09 — Synced to current implementation: fixed back button condition (was "when isListPage is false" — corrected to "when isDetailPage is true", since section pages are also not list pages but don't show the back button)
- 2026-04-09 — Added three breadcrumb mode descriptions (list / section / detail); clarified sticky wrapper `<div>` in AppShell; documented `MobileTopBar` details
- 2026-04-09 — Topnav padding changed from `md:px-16` to `md:px-8`
- 2026-04-09 — Initial documentation written
