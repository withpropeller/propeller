# Tables

## Current state

Most list pages use the `DataTable` component (`apps/web/src/components/ui/DataTable.tsx`), which wraps Pax `Table` primitives with consistent visual defaults and a standard set of props.

**Exception — Webhooks page**: The Webhooks page (`/dashboard/developer/webhooks`) uses a hand-written `<table>` instead of `DataTable`. The page requires inline Edit/Delete action buttons per row, a custom failure-count banner, and a CTA-bearing empty state — patterns that don't fit `DataTable`'s declarative column model cleanly. The visual conventions (container style, header row, cell padding, hover state, skeleton loading, `ErrorState` inline) are the same as `DataTable`. See the **Webhooks exceptions** section below.

### Container

```
bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden
[&_tbody_tr:last-child]:border-0
```

No outer shadow. Rounded corners with a light border. Overflow hidden clips the rounded corners on header and last row. The last tbody row has its bottom border removed so it doesn't double up with the container border.

### Header row

```
border-b border-border-primary-light bg-surface-secondary
```

- Background: `bg-surface-secondary` — a subtle fill that distinguishes headers from rows without being heavy
- Font weight: regular (`font-medium text-xs`) — not bold, not uppercase
- Text colour: `text-content-tertiary`
- Alignment: left-aligned by default
- Case: **sentence case** on all column headers

### Data rows

- Background: `bg-surface-primary` (white / light surface)
- Hover: `group-hover:bg-surface-secondary` — subtle row highlight on hover
- Dividers: hairline `border-b border-border-primary-light` between rows only
- No outer border on individual rows, no vertical column dividers
- Minimum row height: `min-h-14`
- Rows are clickable (`cursor-pointer`) with a click handler; checkbox clicks are excluded from row navigation

### Checkbox column

The checkbox column is implemented via two PAX components:

- **Header**: `TableSelectHeader` → renders a `<th>` with PAX's built-in `px-4 py-2.5 align-middle` base classes
- **Body**: `TableSelectCell` → renders a `<td>` with PAX's built-in `px-4 py-2 align-middle h-14` base classes

Both receive `style={{ paddingRight: '4px' }}` and `className="flex items-center justify-center"` via DataTable.

**Why flexbox, not `vertical-align`:** PAX `TableCell` includes `align-items-center` in its base classes — this is a flex property and is completely inert without `display: flex`. Previous fix attempts used `vertical-align: middle` on `<td>`, which positions the *cell* within the *row* but does not center block or inline-block children *within* the cell. Adding `flex items-center justify-center` activates `display: flex` on the cell, making `align-items: center` work as PAX intended.

**Why the inline style for `paddingRight`:** PAX ships `px-4` as a hardcoded base class on `<th>` and `<td>`. A Tailwind `pr-*` class in `className` may or may not override it depending on Tailwind v4's CSS generation order. Inline styles always win regardless of specificity.

### Cell padding

- **Checkbox cell**: PAX base `px-4`; right padding overridden to `4px` via inline style; left padding remains `16px`
- **First content cell**: `pl-0 pr-4` — `paddingLeft: 0` is enforced via inline style on the `<th>` (to reliably override PAX's `px-4` base class) and via Tailwind `pl-0` on body `<td>` (plain elements, no PAX override needed)
- **All other cells**: `px-4`
- **Vertical padding**: `py-2` on body cells; `py-2.5` on header cells (PAX default)

### Two-line cells

Cells frequently contain a primary value and secondary metadata stacked vertically:

```tsx
<div>
  <div className="text-sm text-content-primary font-semibold">Main value</div>
  <div className="text-xs text-content-tertiary">Secondary info</div>
</div>
```

This is used for: entity name + ID, card number + network, date + time. The second line is always `text-xs text-content-tertiary`, never a separate column.

### Status and type badges

Status and type columns render the `Badge` component with `variant="status"` or `variant="type"`:
- Tinted lozenge (Pax `Chip` variant="subtle") — soft background tint, no hard border
- Colour is determined by semantic mapping in `Badge.tsx`, not by the calling page
- Labels are sentence case and normalised (underscores/hyphens replaced, words capitalised)

### Filter toolbar

Appears above the table on list pages. Layout:

```
[Search input]  [Filter A ▾]  [Filter B ▾]  [FilterChip ×]     [Export]
```

- **Search input**: Pax `InputGroup` with magnifying glass addon, `w-[240px] h-8`
- **Filter dropdowns**: one `DropdownMenu` trigger button per filter type (e.g. Status, Network, Type, Currency), `variant="outline" color="secondary" size="sm"`. Each filter type is independent — there is no single "Add filter" button.
- **Active filter chips** (`FilterChip`): render inline after the filter buttons when a filter is applied. Style:
  ```
  inline-flex items-center h-8 pl-2.5 pr-1 gap-1 text-xs font-medium rounded-lg
  border border-border-primary-light bg-surface-secondary text-content-secondary
  ```
  Label part is `text-content-quaternary`. Each chip has an `×` dismiss button (`w-5 h-5 rounded-md hover:bg-surface-tertiary`).
- **Export button**: right-aligned, `variant="outline" color="secondary" size="sm"`. When rows are selected, the label updates inline: `Export 3 selections` (singular: `Export 1 selection`). No separate bulk action bar.

There are no segmented controls and no bulk action bar in the filter row. All filtering is via independent dropdown menus and dismissible `FilterChip` components. Selection count is surfaced in the export button label.

### Empty state

DataTable accepts an `emptyState` prop:

```ts
{
  title: string
  description: string
  icon: ReactNode
}
```

Empty state renders centred in the table body area with the icon, title, and description. When active filters are present, the description changes to indicate no results match the filters. When no filters are active, the description is the default no-data message.

### Loading state

10 skeleton rows render during loading, each row containing a skeleton checkbox (`h-4 w-4 rounded`) and skeleton cells.

### Pagination

Footer bar: `px-4 py-3 border-t border-border-primary-light flex items-center justify-center gap-6`

Previous and Next are plain `<button>` elements (not Pax `Pagination`), centred:
- **Previous**: `text-sm text-content-tertiary`, `opacity-40 cursor-not-allowed` when `hasPrevious` is false
- **Next**: `text-sm font-semibold text-content-primary`, `opacity-40 cursor-not-allowed` when `hasMore` is false

Pagination is cursor-based. Cursors are passed via URL params and threaded into the API via `before`/`after` parameters. The footer only renders when `hasMore` or `hasPrevious` is true. There is no record count display in the pagination footer.

### Webhooks exceptions

The Webhooks page uses a handwritten `<table>` with the same container, header, and row conventions but with three intentional differences:

1. **No checkbox column** — webhooks don't support bulk export or selection
2. **Inline actions per row** — Edit and Delete buttons in the last column (`onClick` stops propagation to prevent panel opening)
3. **Custom empty state** — true-empty shows a CTA button ("Add your first endpoint") inline in the table; search-empty shows a "Clear search" link. Neither uses `DataTable`'s `emptyState` prop.

Row hover uses `hover:bg-surface-tertiary` (slightly different from DataTable's `group-hover:bg-surface-secondary` but visually equivalent). Selected row (when panel is open for that webhook) uses `aria-selected:bg-surface-secondary`.

A failure-count `Alert` banner (`severity="warning" variant="filled"`) renders above the toolbar when any webhook has recent delivery failures. This is page-level, not table-level.

## Decisions and rationale

**Why regular-weight sentence-case headers instead of bold or uppercase**
Bold uppercase column headers are a holdover from dense enterprise UIs. In this product the data itself is the focus — headers are navigational labels, not headings. Regular weight sentence case is visually quieter and lets the data stand out.

**Why no vertical dividers**
Vertical dividers between columns add grid-like rigidity that's visually heavy and suggests equal column weight. These tables have columns of varying importance — the entity name column is primary, others are secondary metadata. Removing vertical dividers lets the eye flow horizontally across rows more naturally.

**Why two-line cells instead of extra columns**
Adding a separate column for every piece of metadata makes tables too wide and forces horizontal scrolling on tablet/mobile. Stacking secondary info (ID, network, time) beneath the primary value keeps the column count low and the table scannable.

**Why one DropdownMenu per filter type instead of a single "Add filter" button**
A single "Add filter" button requires a multi-step interaction to apply any filter. Individual per-type dropdowns allow direct one-click access to the most common filters. The filter count is small and predictable (typically 3–4 types), so surfacing them all is cleaner than hiding them behind a generic button.

**Why the selection count is in the export button, not a separate bar**
A separate bulk action bar that slides in/out adds animation complexity and occupies vertical space above the table. Embedding the count in the export button (`Export 3 selections`) is sufficient — export is the only bulk action available on these tables right now. If more bulk actions are needed in future, re-evaluate whether a bar is warranted.

**Why badge colours are determined by the Badge component, not the caller**
If each call site chose its own colours, the same status value (`active`, `pending`, etc.) could render differently across pages. Centralising the colour mapping in `Badge.tsx` ensures consistent semantic colour across the whole app.

## What good looks like

Reference: the Issuing Cards list page.

- Header row is visually distinct but not heavy — a slight grey fill, regular weight labels
- Rows are white, clean, with only horizontal hairlines between them
- Card column shows `•••• 4242` (mono, semibold) with the network name below it
- Status column shows a tinted chip (`Active`, `Inactive`, `Frozen`) with no border
- Filter toolbar shows search + one dropdown per filter type + any active chips inline; no segmented controls
- Empty state (when no cards exist) shows a card icon, "No cards found", and a helpful description
- On hover, the row tints subtly — one visual affordance for clickability

## Change log

- 2026-04-09 — Synced to current implementation: documented Webhooks page as handwritten `<table>` exception (inline actions, custom empty state, failure banner); corrected "all data tables" claim to "most list pages"
- 2026-04-09 — Corrected `FilterChip` style (`border-border-primary-light`, `bg-surface-secondary`, `rounded-lg`, `font-medium`, `h-8`); replaced single "Filter button" description with per-type `DropdownMenu` pattern; corrected pagination footer to plain centred Previous/Next buttons (no record count, not Pax `Pagination`); updated first-cell padding to `pl-0 pr-4`; added column visibility section
- 2026-04-09 — Checkbox centering fixed properly: added `flex items-center justify-center` to both `TableSelectHeader` and `TableSelectCell`. PAX `TableCell` includes `align-items-center` but was missing `display: flex`, making the property inert. Previous attempts used `vertical-align: middle` on `<td>` which positions the cell within the row, not content within the cell. Removed `verticalAlign: 'middle'` from inline styles. Removed redundant `className: 'pl-0'` from the accounts first column (DataTable already handles this for `idx === 0`).
- 2026-04-09 — Last row bottom border removed; "Add filter" button removed; bulk action bar removed in favour of inline export count; sentence case enforced across all column headers; date column style updated to `text-sm text-content-secondary`
- 2026-04-09 — Initial documentation written
