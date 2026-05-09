# Layout

## Current state

The app shell is built from three structural siblings inside a flex row:

1. **Sidebar** — fixed, `z-30`, takes no space in flow
2. **Content area wrapper** — pushes left to clear the sidebar via margin-left; contains topnav + main scroll area + GlobalPanel
3. **GlobalPanel** — flex sibling to `<main>` inside the content wrapper, causes reflow

### Sidebar offset

The content area uses `margin-left` to clear the sidebar:

```
ml-0         (mobile, sidebar hidden)
md:ml-14     (tablet, sidebar collapsed to icon rail — 56px)
lg:ml-56     (desktop, sidebar fully expanded — 224px)
```

When the mobile sidebar is open, `ml-70` is applied temporarily (280px) with a `transition-[margin-left] duration-220 ease-out` transition, and a backdrop overlay (`z-20`, `bg-black/30`) covers the content. A separate tablet-expanded backdrop appears when the tablet sidebar is manually expanded.

### Topnav

Height: `h-14` (56px). Internal padding: `px-4 md:px-8`. The topnav renders full-width inside the content wrapper, sticky at `top-0 z-10` within the main scroll container. It is not fixed to the viewport — it scrolls with the container.

On mobile, `MobileTopBar` renders instead of `Topnav`. It is a dark bar (`bg-[#0a0a0b]`, `h-12`) with a hamburger button, centred brand name, and search button.

### Content padding

Below the topnav, page content is wrapped in:

```
p-4 md:p-6 lg:p-16
```

Inside that, content is constrained to `max-w-[1200px] mx-auto`. This means:
- On large screens, content centres horizontally up to 1200px
- The topnav (which sits outside this wrapper) spans the full content area width

Previously the padding was asymmetric (`px-4 pt-4 pb-6 md:px-16 md:pt-8 md:pb-10`) with no max-width wrapper. The current symmetric scale + max-width approach is simpler and more consistent across breakpoints.

### GlobalPanel — reflow, not overlay

`GlobalPanel` is a flex sibling to `<main>`:

```tsx
<div className="flex flex-1 min-h-0 overflow-hidden">
  <main className="flex-1 min-w-0 overflow-y-auto">...</main>
  <GlobalPanel />
</div>
```

The panel is implemented as a **width-animating flex item**, not a fixed/translated overlay:

```
/* Outer: animates width to push <main> */
flex-shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out
w-0  →  w-full md:w-95 lg:w-105 (when open)

/* Inner: fixed-width so content never reflows mid-animation */
h-full w-screen md:w-95 lg:w-105 bg-surface-primary border-l overflow-y-auto
```

When the panel opens, `<main>` shrinks to accommodate it — no overlay, no backdrop. Content remains fully interactive and visible alongside the panel on desktop.

The panel header is a minimal sticky bar containing only a right-aligned close button (`X size={16}`, `p-1.5`). There is no entity-type title in the panel header — the panel content itself establishes context.

Previously the panel used `fixed` + `translate-x-full/translate-x-0` animation with a `bg-black/40` backdrop overlay (`z-30`). The flex-width approach was adopted so the panel genuinely compresses the content area rather than floating over it, and eliminates the backdrop entirely on desktop.

### Z-index stack

| Layer | Value | Element |
|---|---|---|
| Mobile/tablet backdrop | z-20 | Sidebar overlay |
| Topnav | z-10 | Sticky within scroll container |
| Sidebar | z-30 | Fixed, always on top of content |
| GlobalPanel | — | Flex item, no fixed positioning |

### Background colours

- App root: `bg-surface-secondary`
- Content area wrapper: `bg-surface-primary`
- This creates the effect where the sidebar and panel appear to sit against a slightly different surface than the main content area

### Sandbox banner

When `isSandboxMode` is true, a Pax `Alert severity="warning" variant="filled"` banner renders between the topnav and the content padding area:

> "You're viewing test data. No real transactions will be affected."

It uses `rounded-none border-x-0 border-t-0` to read as a full-width system message flush to the layout edges.

## Decisions and rationale

**Margin-left push instead of CSS grid or padding-left**
Margin-left with a transition matches the sidebar's width animation cleanly. A CSS grid or padding approach would require more coordination to animate.

**Topnav outside the `max-w` wrapper**
The topnav needs to span the full width of the content area for its border-bottom to feel continuous. Placing it outside the `max-w-[1200px]` wrapper achieves this. Content inside the topnav uses `px-4 md:px-8` to align roughly with the left edge of page content at common viewport widths.

**`max-w-[1200px]` with `mx-auto`**
Prevents content from becoming excessively wide on ultrawide monitors. 1200px is wide enough for the three-column detail page layouts without forcing users to scan very long horizontal lines.

**Reflow panel instead of overlay**
The GlobalPanel pushing the content area (rather than floating over it) keeps both the list and the detail visible simultaneously on large screens. The width-animation approach (rather than translate) achieves this genuinely — the content area physically narrows. A translate-based fixed overlay would achieve the visual effect but `<main>` would remain full-width underneath, which breaks layout assumptions for sticky elements and scroll containers inside `<main>`.

**Sandbox banner below topnav, above content**
The Pax `Alert` banner signals environment context at the top of the scroll area. It's a filled warning alert with `rounded-none border-x-0 border-t-0` so it reads as a full-width system message, not an inline content element.

## What good looks like

On a desktop viewport (≥1024px):
- The sidebar left edge, topnav left content edge, and page header left edge are all visually aligned
- The topnav border-bottom creates a continuous horizontal band separating chrome from content
- No content touches the screen edge — everything is inside the padded content area
- When the GlobalPanel is open, the main content compresses but the topnav remains full-width

On tablet:
- Sidebar collapses to icon rail; content area expands accordingly
- Topnav remains full-width

On mobile:
- Sidebar is off-screen; hamburger opens it with overlay
- Content is single-column at `p-4`

## Change log

- 2026-04-09 — Synced to current implementation: verified accurate against AppShell.tsx, Sidebar.tsx, Topnav.tsx — no structural changes found
- 2026-04-09 — Removed stale section on negative-margin tab technique; added MobileTopBar and tablet-expanded backdrop details; added sandbox banner copy; noted `duration-220` transition
- 2026-04-09 — GlobalPanel refactored from fixed overlay to flex-width reflow; content padding changed to `p-4 md:p-6 lg:p-16` with `max-w-[1200px]` wrapper
- 2026-04-09 — Initial documentation written
