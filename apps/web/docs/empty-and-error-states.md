# Empty and Error States

## Current state

The app has three categories of non-data states: **empty tables**, **field-level empty/unconfigured values**, and **error states**.

---

### Empty tables

Handled by `DataTable` via the `emptyState` prop:

```ts
emptyState?: {
  title: string
  description: string
  icon: ReactNode
}
```

The table body renders the icon, title, and description centred in the table area when there are no rows.

**Two variants of description copy:**

| Condition | Description copy |
|---|---|
| Active filters exist | "No [entities] match your current filters. Try adjusting or clearing your filters." |
| No filters, no data | Default empty message, e.g. "No cards have been created yet." |

This distinction matters because "no results" and "nothing exists" require different user actions. Filter-empty states should guide the user to modify filters; true empty states may include a CTA to create the first record.

**Icons used per entity:**
- Cards: `CreditCard`
- Programs: `LayoutGrid`
- BINs: `Database`
- Transactions: `Activity`
- Authorizations: `Clock`
- Filter-empty fallback: `Filter`

**Exception — Webhooks page**: Does not use `DataTable` or the `emptyState` prop. Empty state is rendered inline in a `<td>`:
- True empty (no endpoints yet): plain text "No webhook endpoints yet." + ghost primary button "Add your first endpoint"
- Search empty: "No endpoints match `{search}`." + ghost primary "Clear search" link

This is intentional — the webhook empty state needs a direct CTA that's visually closer to the table than a page-level action would be.

---

### Field-level states

Three distinct states for individual label/value rows:

#### 1. Unconfigured field (user action required)

A value that is absent because the user hasn't configured it — and should.

```
Label     Configure →
```

- Value text: amber (`text-feedback-warning-main` or equivalent)
- Inline link: "Configure" in `text-action-primary-main`, opens the relevant settings
- Not a banner, not a tooltip, not a modal trigger — inline at the field level

#### 2. Intentional empty / not applicable

A value that is absent for a valid reason (field doesn't apply, no data exists yet, the feature is off).

```
Label     —
```

- Value: `—` (em dash) in `text-content-tertiary`
- No link, no action affordance

**In table cells**, absent values have two representations depending on context:
- For structured fields where absence is meaningful (e.g. no cardholder assigned, no program linked): descriptive text like `No cardholder`, `No program`, `No name` — rendered as `text-content-tertiary font-normal`. This pattern was introduced to help users distinguish "empty" from "no data loaded".
- For incidental absent data (e.g. expiry not returned by API): `—` is still used.

#### 3. Optional field the user could fill in

An absent value for a field the user can optionally populate.

```
Label     — Add →
```

- Value: `—` followed by an "Add" link in `text-action-primary-main`
- The Add link leads directly to the relevant input

**The key distinction between states 1 and 3:** Unconfigured (amber) = something is wrong or incomplete and needs attention. Optional empty = nothing is wrong, but the user can enrich the data if they want.

---

### Error states

#### Table-level errors

`DataTable` handles fetch errors via an `error` prop + optional `onRetry` callback. When `error` is set, the table body renders `ErrorState` instead of rows or the empty state.

The Webhooks page (which uses a handwritten `<table>`) renders `ErrorState` directly in a `<td colSpan={6}>` — same component, same visual result, without going through `DataTable`.

`ErrorState` (`apps/web/src/components/ui/ErrorState.tsx`):
- Centred layout in the table body area (`py-12`)
- `AlertTriangle` icon in a `rounded-full bg-feedback-danger-light` circle
- Heading: "Something went wrong" (`text-sm font-semibold text-content-primary`)
- Optional message: the error value (string or object serialised to JSON)
- Optional "Try again" ghost button (`variant="ghost" color="secondary" size="sm"`) — only shown when `onRetry` is provided

This distinguishes error state from empty state at the component level.

#### Form errors

Form field errors use Pax `FieldError` beneath the relevant field.

#### API mutation errors

Failed API mutations (create, update, delete) surface via the Pax `toast` system — a non-blocking notification that doesn't interrupt the form state.

---

## Decisions and rationale

**Why amber for unconfigured, not a banner**
A banner-level warning for a single unconfigured field is disproportionate. It would dominate the page and suggest system-level failure. Amber inline text communicates "this field specifically needs attention" at exactly the right scope.

**Why `—` instead of `null`, `N/A`, or an empty string**
`null` or empty renders as blank, which is ambiguous — the user doesn't know if data is missing or if the field simply wasn't rendered. `N/A` is jargon. An em dash is a conventional typographic signal for "no value" that reads cleanly.

**Why some table cells use descriptive text instead of `—`**
For columns where the absent value carries meaning (e.g. a card with no assigned cardholder is a notable state), `No cardholder` communicates that state more directly than `—`. A cell full of `—` values is harder to scan than a mix of values and "No X" labels. The rule: use descriptive text when absence is a meaningful entity state; use `—` when absence is incidental.

**Why filter-empty and true-empty descriptions differ**
These are different problems. "Nothing matches your filters" calls for modifying search criteria. "Nothing exists yet" may call for creating a record. Conflating them with a single message leads to confusion: a user with active filters who sees "No cards yet" might think there are genuinely no cards in the system.

**Why no CTA in every empty state**
Not every empty table should have a "Create your first X" button. For some entities (e.g. transactions, authorizations) the user can't directly create records — they happen as a result of other actions. Adding a create button there would be wrong. CTAs in empty states are added only when the user can and should take a direct action.

---

## What good looks like

Every non-data state should give the user enough information to understand what happened and what to do next:

| State | User understands | User can act |
|---|---|---|
| Table empty, no filters | Nothing has been created yet | CTA if creatable, informational text if not |
| Table empty, filters active | Filters excluded all results | "Clear filters" or adjust them |
| Field unconfigured | This field needs to be set up | "Configure" link |
| Field intentionally empty | No value; nothing to do | Nothing (no affordance) |
| Field optionally empty | No value; can add one | "Add" link |

An empty state is correctly implemented when a user who has never used the product can read it and know exactly what to do without opening a help article.

## Change log

- 2026-04-09 — Synced to current implementation: documented Webhooks page exceptions (custom inline empty state with CTA, `ErrorState` rendered directly in `<td>` outside `DataTable`)
- 2026-04-09 — Table-level error state formally documented via `ErrorState` component; form errors and toast errors documented separately
- 2026-04-09 — Table cells: descriptive "No X" text pattern adopted for meaningful absence states (cardholder, program, name, email, phone); `—` retained for incidental absence
- 2026-04-09 — Initial documentation written
