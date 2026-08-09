---
name: MyMenu
description: Ordering pages for small restaurants. Calm, high-contrast, bilingual. Built to be read at arm's length in a bright kitchen and to make one number impossible to miss.
status: draft
updated: 2026-08-05
colors:
  surface-base: '#FBFAF8'
  surface-raised: '#FFFFFF'
  surface-sunken: '#F2F0EC'
  ink-primary: '#16181D'
  ink-secondary: '#5B6270'
  ink-disabled: '#A2A8B4'
  accent: '#0F7B5F'
  accent-strong: '#0A5D47'
  accent-wash: '#E6F2EE'
  status-waiting: '#5B6270'
  status-cooking: '#B45309'
  status-cooking-wash: '#FDF3E4'
  status-ready: '#0F7B5F'
  status-ready-wash: '#E6F2EE'
  status-problem: '#B91C1C'
  status-problem-wash: '#FCEBEA'
  border-hairline: '#E4E1DB'
  border-strong: '#C9C5BD'
  focus-ring: '#0F7B5F'
typography:
  display:
    fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif"
    fontSize: '56px'
    fontWeight: 700
    lineHeight: '1.05'
    letterSpacing: '-0.02em'
  title:
    fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif"
    fontSize: '28px'
    fontWeight: 600
    lineHeight: '1.2'
  heading:
    fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif"
    fontSize: '20px'
    fontWeight: 600
    lineHeight: '1.3'
  body:
    fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif"
    fontSize: '16px'
    fontWeight: 400
    lineHeight: '1.55'
  body-strong:
    fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif"
    fontSize: '16px'
    fontWeight: 600
    lineHeight: '1.55'
  kitchen:
    fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif"
    fontSize: '22px'
    fontWeight: 600
    lineHeight: '1.35'
  meta:
    fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif"
    fontSize: '14px'
    fontWeight: 400
    lineHeight: '1.45'
  numeric:
    fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif"
    fontVariantNumeric: 'tabular-nums'
rounded:
  sm: '8px'
  md: '14px'
  lg: '20px'
  full: '9999px'
  DEFAULT: '14px'
spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '24px'
  '6': '32px'
  '7': '48px'
  '8': '64px'
  gutter: '16px'
  margin-mobile: '16px'
  margin-desktop: '32px'
  touch-min: '48px'
components:
  button-primary:
    background: '{colors.accent}'
    color: '#FFFFFF'
    radius: '{rounded.md}'
    minHeight: '{spacing.touch-min}'
    padding: '{spacing.3} {spacing.5}'
    typography: '{typography.body-strong}'
  button-secondary:
    background: '{colors.surface-raised}'
    color: '{colors.ink-primary}'
    border: '1px solid {colors.border-strong}'
    radius: '{rounded.md}'
    minHeight: '{spacing.touch-min}'
  savings-counter:
    background: '{colors.accent-wash}'
    color: '{colors.accent-strong}'
    typography: '{typography.display}'
    radius: '{rounded.lg}'
    padding: '{spacing.6}'
  order-card:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-hairline}'
    radius: '{rounded.md}'
    padding: '{spacing.4}'
    typography: '{typography.kitchen}'
  menu-item-row:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-hairline}'
    radius: '{rounded.md}'
    minHeight: '72px'
  status-pill:
    radius: '{rounded.full}'
    typography: '{typography.meta}'
    padding: '{spacing.1} {spacing.3}'
  input:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-strong}'
    radius: '{rounded.sm}'
    minHeight: '{spacing.touch-min}'
    typography: '{typography.body}'
---

## Brand & Style

MyMenu is a tool for someone whose hands are busy. Every visual decision answers
to one of three rooms: a hot kitchen where a tablet is read from a metre away, a
restaurant table where a stranger is deciding in ten seconds whether this is
worth the effort, and an owner's bed at midnight where a single number decides
whether he renews.

So the posture is **plain, warm, and loud where it counts.** Not a startup
dashboard — there are no sparklines, no gradient hero, no illustration of a
smiling delivery driver. The product looks like a well-run shop: clean surfaces,
strong type, one confident colour, and enormous numbers where numbers matter.

There is a deliberate positioning choice in the palette. The delivery platforms
this product exists to escape shout — Talabat in bright orange, Deliveroo in
electric turquoise, both tuned to grab a hungry stranger scrolling a feed.
MyMenu is not selling to that stranger. It is selling to the owner, so the green
is deep and the surfaces are calm. A restaurant owner should be able to feel the
difference before reading a word of it.

## Colors

The palette is small on purpose. One brand colour, four status colours, and a
warm neutral stack.

- **Warm White (`#FBFAF8`)** — the base canvas everywhere. Warm rather than blue-
  white so a phone screen at a dinner table does not feel like a form.
- **Ink (`#16181D`)** — all primary text. Near-black, not pure black; pure black
  on warm white reads as harsh at kitchen distance.
- **Dirham Green (`#0F7B5F` / strong `#0A5D47`)** — the single brand colour. It
  carries exactly three jobs: primary actions, the Savings Counter, and the
  *ready* state. Money kept, and work finished. It is never used for decoration,
  never for a header band, never as a background for large areas of text.
- **Accent Wash (`#E6F2EE`)** — the only tinted surface. Reserved for the
  Savings Counter block, so that block is visually unique in the entire product.
- **Amber (`#B45309`)** — *cooking*. The one colour that means "in progress".
- **Red (`#B91C1C`)** — *problem* and *cancelled*, and nothing else. Never for
  emphasis, never for a discount badge.
- **Slate (`#5B6270`)** — secondary text and the *received* state. A new order is
  deliberately the least colourful thing on the Order Screen; colour is earned by
  progress.
- **Hairline (`#E4E1DB`)** — separation between rows and cards. Anything heavier
  starts to look like a spreadsheet.

Avoid: gradients of any kind, a second accent colour, coloured page headers,
red-for-emphasis, and any use of green that is not an action, a saving, or a
finished order.

**The neutral stack is tinted, not neutral.** It was a warm off-white, which
left the page ground (`#fbfaf8`) and a card (`#ffffff`) 1.02:1 apart — a
difference nobody could see, so no panel in the product read as a panel. The
stack is now the accent hue desaturated almost to paper (`#eaf1ec` ground,
white cards, `#dde8e0` wells), and the dark ordering page is a green-black
rather than a blue-grey charcoal.

This is not a second colour. It is the same one, at the far end of its
saturation, and it is still flat — the gradient ban above is unaffected. It
does cost contrast: `--color-accent` on the new ground is 4.55:1, which passes
but leaves no margin, so body-size links use `--color-accent-strong` (6.9:1)
instead. Solid `--color-accent` buttons with white type are 5.2:1 and unchanged.

**A dark theme the user can choose is deliberately not in v1.** Shipping one
well-tested light theme is worth more than two half-tested ones, and the Order
Screen's contrast requirements are easier to guarantee in a single theme.

**But the Diner's ordering page is dark, and it is not a theme.** It is the one
fixed palette for that one surface, scoped in `globals.css` as `.diner-dark`,
and no user setting reaches it. The rooms are not all lit the same way:

- The **Owner's dashboard** and the **Order Screen** are read in a bright
  kitchen under strip lighting, often on a wall-mounted tablet. Light, always.
- The **Diner** is sitting at a table in a dining room lit for eating, holding
  a phone at arm's length. A white page at full brightness is the thing people
  put face-down on the table.

Food is also the argument. A photograph of a mixed grill on charcoal is how
every menu worth copying prints it; the same photograph on white looks like a
stock listing. The tile colours for dishes without a photograph carry the same
logic — they wash the ground at 26% instead of 14%, and the letter lifts 42%
toward white, because a palette tuned for paper fails on charcoal.

Riyal Green is lifted from `#0f7b5f` to `#2fb887` on that surface only. Same
hue, same meaning, enough contrast to clear 4.5:1 against the dark ground.

## Typography

One family throughout: **IBM Plex Sans Arabic**, which carries both Arabic and
Latin with matched weight and rhythm. A single family across both languages is
not a shortcut — it is what keeps an Arabic screen and an English screen feeling
like the same product.

The ramp is short, and each step has a room it belongs to:

| Role | Size | Where |
|---|---|---|
| `display` | 56px | The Savings Counter, and the landing page's cost figure. Nothing else. |
| `title` | 28px | Page titles. |
| `heading` | 20px | Section headers, menu category names. |
| `kitchen` | 22px | Everything on the Order Screen and the Driver list. |
| `body` | 16px | Default. Never smaller for anything a Diner must read. |
| `meta` | 14px | Timestamps, helper text, status pill labels. Never for prices. |

Two hard rules. **`kitchen` is the floor on the Order Screen** — no text on that
surface may be smaller, including timestamps. And **all currency and quantity
figures use tabular numerals** (`{typography.numeric}`), so a counter that ticks
upward does not jitter and a column of prices aligns.

## Layout & Spacing

Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px. Large gaps separate surfaces;
small gaps bind related things. Margins are 16px on mobile, 32px from 768px up.

Single column below 768px, always. The Ordering Page and the Driver list stay
single column at every width — they are phone products that happen to be
reachable on a laptop. The Owner Dashboard goes to two columns at 1024px; the
Savings Counter spans the full width at every breakpoint and is never demoted
below a fold.

The Order Screen is the exception to everything: a responsive card grid, one
column on phone, two from 768px, three from 1280px, with no sidebar and no
persistent chrome beyond a single header strip. Nothing may be added to that
screen that is not an order.

**Minimum touch target is 48px** on every surface, and 64px for the status-
advance control on an order card — that one gets tapped with a knuckle.

## Elevation & Depth

Depth comes from tone, not shadow. `surface-raised` sits on `surface-base`;
`surface-sunken` holds input groups and empty states. There is exactly one
shadow in the system, on the Cart bar that floats above the Ordering Page, and
it exists to say "this is on top of the scrolling content" — a literal
statement, not a hierarchy hint.

No shadow on cards. No shadow on buttons. No hover lift.

## Shapes

`{rounded.sm}` (8px) for inputs and status pills. `{rounded.md}` (14px) for
buttons, cards, and menu rows — the default. `{rounded.lg}` (20px) for the
Savings Counter block alone, which reinforces that it is a different kind of
object. `{rounded.full}` only for status pills' end caps and avatar circles.

Photographs of menu items clip to the container radius exactly, and always at
4:3. A menu with mixed aspect ratios looks like a classifieds page.

## Components

- **Savings Counter** — the signature object. `{colors.accent-wash}` block,
  `{rounded.lg}`, the figure in `display` and `accent-strong`, a one-line plain-
  language label above it and the formula in `meta` below. Full width, top of
  the Owner Dashboard, above the fold at 360px. It is the only element in the
  product allowed to use `display` type on a coloured field.
- **Order card** — `surface-raised`, hairline border, `kitchen` type. A status
  pill top-start, elapsed time top-end, line items stacked, note in
  `status-cooking` if present, total in `body-strong` at the bottom, and one
  full-width 64px advance button. No icons, no avatars, no menus.
- **Status pill** — text label plus a leading glyph, on a wash background. The
  glyph carries the same meaning as the colour so the state survives a
  colourblind reader and a bad tablet screen: `●` received, `◐` cooking,
  `✓` ready, `!` problem.
- **Menu item row** — 72px minimum, photo thumbnail at the start (or a neutral
  placeholder block, never a broken-image icon), name in `body-strong`, price in
  `body-strong` with tabular numerals at the end, description in `meta` truncated
  to one line. An unavailable item drops to `ink-disabled`, keeps its layout, and
  gains a `sold out` pill — it is never hidden, because a diner who cannot find
  the item they came for will ask a human.
- **Cart bar** — fixed to the bottom edge, `surface-raised`, the one shadow in
  the system, item count at the start, total at the end, full-width primary
  action. Appears only when the Cart is non-empty and animates up once.
- **Primary button** — `{colors.accent}`, white text, 48px minimum, full width on
  mobile. One per screen. If a screen seems to need two, one of them is
  secondary.
- **Landing figure** — the yearly commission cost in `display`, in `ink-primary`
  not green. Green is for money kept; the cost of the status quo is stated in
  plain ink, without dramatisation.

## Do's and Don'ts

| Do | Don't |
|---|---|
| One green, used for actions, savings, and *ready* | Introduce a second brand colour, or tint headers |
| State the money in `display` type, once per screen | Scatter big numbers; the counter loses its power |
| Pair every status colour with a glyph and a word | Rely on colour alone for order state |
| Keep the Order Screen to orders and nothing else | Add stats, banners, or promos to the kitchen view |
| Tabular numerals for every price and counter | Let a ticking figure shift horizontally |
| Grey out sold-out items in place | Hide unavailable items from the menu |
| Warm neutrals, hairline borders | Shadows for hierarchy, hover lifts, gradients |
| Mirror the whole layout in Arabic | Mirror numerals, phone numbers, or the logo |
