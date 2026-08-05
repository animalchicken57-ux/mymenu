---
name: MyMenu
description: How MyMenu behaves — information architecture, states, interactions, accessibility, and the flows that matter. Peer to DESIGN.md, which owns how it looks.
status: draft
updated: 2026-08-05
sources:
  - ./prd.md
  - ./product-brief.md
  - ./DESIGN.md
---

## Foundation

**Form factor: responsive web, no native app.** This is a product decision, not a
budget one — the Diner's willingness to order collapses if a download stands in
the way, and the whole pitch depends on the Diner ordering.

Four surfaces, three device assumptions:

| Surface | Primary device | Assumption |
|---|---|---|
| Ordering Page (Diner) | Phone, one hand, standing or seated | Never authenticated. Possibly poor signal. |
| Order Screen (Staff) | Tablet, propped, viewed from ~1m | Always authenticated, always on, busy room |
| Driver list (Driver) | Phone, outdoors, one hand, gloves possible | Authenticated, screen may be in sunlight |
| Owner Dashboard + admin | Phone at night, laptop by day | Authenticated, unhurried |

Visual identity is DESIGN.md; where this document names a colour, radius, or type
role it does so by token (`{colors.accent}`, `{typography.kitchen}`). No UI
system is inherited — components are built to the DESIGN.md spec directly, which
keeps the Order Screen's unusual sizing requirements from fighting a library's
defaults.

## Information Architecture

**Public (no authentication)**
- `/` — Landing Page. For restaurant owners. Savings estimator, one primary
  action.
- `/r/{restaurant}` — Ordering Page. For Diners. The Menu.
- `/r/{restaurant}?table=6` — same page, dine-in preset. What a Table QR opens.
- `/o/{orderRef}` — Order status page. The Diner's link back.
- `/support` — FAQs and contact form.
- `/login`, `/signup`, `/forgot`, `/reset/{token}` — access.

**Authenticated, routed by Role after login**
- Owner → `/dashboard` — Savings Counter, today, flags. Then `/menu`,
  `/orders`, `/customers`, `/settings`, `/team`.
- Staff → `/kitchen` — the Order Screen. Plus `/menu` (availability toggle
  only) and `/account`.
- Driver → `/deliveries`. Plus `/account`.

**Two navigation shapes, on purpose.** The Owner gets a normal navigation bar —
they browse. Staff and Drivers get *no* navigation: their Home surface fills the
screen, and the only other reachable places are Account and Support, behind a
single control in the header. A kitchen tablet with a nav bar is a kitchen tablet
someone gets lost in.

**Depth ceiling: two levels.** No screen in the product is more than two taps
from the Role's Home surface. Where this is uncomfortable — the Menu editor —
the answer is a wider screen, not a deeper tree.

## Voice and Tone

Plain, short, and never clever. The reader is mid-task in a hot room, or a
stranger deciding whether to trust a page they have never seen.

- **Say the thing.** "Order sent to the kitchen." Not "Success!" and not
  "Your order has been successfully submitted."
- **Money in full words.** "You kept 8,740 AED this month" — not "Savings:
  8,740" and not "+8,740".
- **Errors name the fix, not the fault.** "That email already has an account —
  sign in instead?" Not "Invalid credentials." Never "Oops."
- **No exclamation marks anywhere.** No emoji in product chrome.
- **Arabic is written, not translated.** Every string is authored in both
  languages by a human. A machine-translated Arabic interface reads as foreign to
  exactly the audience we are selling to, and that impression is unrecoverable.
- **Never use platform names in product copy.** "Delivery apps", not "Talabat".
  The comparison belongs in the pitch, not in the product.

## Component Patterns

Behaviour only; appearance is DESIGN.md § Components.

- **Order card** — one tap advances status, no confirmation dialog, followed by a
  five-second inline undo that occupies the card's own space rather than a toast.
  A card is never draggable, never swipeable: a wet hand brushing a tablet must
  not change an order.
- **Status pill** — read-only everywhere it appears. Status is changed by the
  advance control, never by tapping the pill, so the same element means the same
  thing on every surface.
- **Cart bar** — appears when the Cart becomes non-empty, persists while
  scrolling, and holds the only path to checkout. The Cart survives reload
  (localStorage, keyed by restaurant) because a phone that rings mid-order must
  not cost the restaurant the sale.
- **Quantity stepper** — plus and minus, no free-text entry, minimum zero.
  Reaching zero removes the line with an undo.
- **Availability toggle** — optimistic: it flips instantly and reverts with a
  message if the write fails. Staff toggle this mid-rush and cannot wait for a
  round trip.
- **Menu editor row** — saves on blur, per field. There is no Save button on the
  Menu editor, and there is never an unsaved-changes dialog. UJ-1's edge case
  (owner interrupted mid-menu) is handled by this pattern alone.
- **Savings Counter** — animates from zero to value once on first paint of the
  session, over roughly 800ms, then never again. It is the emotional beat of the
  product; it is also not a slot machine.
- **Language switch** — takes effect immediately, without reload, and persists to
  the User's Account so a Staff member's choice follows them to any tablet.

## State Patterns

Every surface specifies five states. Empty states are treated as first-class
screens, not as a paragraph of grey text, because three of them are the first
thing a new customer ever sees.

| Surface | Empty | Loading | Error | Offline | Success |
|---|---|---|---|---|---|
| Owner Dashboard | "No orders yet. Print your table codes to get started." + the action | Skeleton blocks matching final layout | Inline retry per block; the Savings Counter never shows a wrong number, it shows nothing | Banner: "Not connected. Showing last known figures." | — |
| Menu editor | "Add your first item" as the single call to action | Skeleton rows | Inline per row, edit preserved | Edits queue and flush on reconnect | Field border flashes `{colors.accent}` for 400ms |
| Ordering Page | "This restaurant isn't taking orders yet." No login prompt, no error styling | Skeleton menu rows | Full-page retry — a Diner cannot debug | "You're offline. Your cart is saved." | — |
| Order Screen | "No active orders." Large, calm, not an error | Skeleton cards | Persistent banner: "Not receiving new orders" — this failure must be impossible to miss | Same banner, plus audible alert every 60s | New card arrives with sound + one 300ms highlight |
| Driver list | "No deliveries assigned." | Skeleton rows | Inline retry | Marks queue locally and flush on reconnect | Row collapses out of the list |
| Customer List | "No customers yet — they appear after the first order." | Skeleton rows | Inline retry | — | — |
| Contact form | — | Button shows a spinner, stays disabled | Message text is preserved and the failure is stated explicitly | "You're offline — we couldn't send this yet." | Full replacement of the form with a confirmation, including what happens next |

**The load-bearing one:** the Order Screen's error and offline states. Everywhere
else, a silent failure is an annoyance. There, it is orders quietly not arriving
while staff believe the restaurant is quiet — which is the single failure that
would lose us a customer permanently. It gets a persistent banner and, offline, a
repeating sound.

## Interaction Primitives

- **Live updates**: Orders push to the Order Screen, the Driver list, and the
  Diner's status page. Target under 5 seconds (FR-17, FR-19, FR-21). Falls back
  to polling every 10 seconds if the live connection drops, silently — the
  banner appears only when both fail.
- **Sound**: one short tone on new order, Order Screen only. Mutable per device,
  persisted per device not per Account, because the tablet by the pass and the
  owner's phone want different answers.
- **Optimistic writes**: availability toggles, status advances, driver
  completion. Everything else waits for the server.
- **Undo over confirm**: five-second inline undo for status advance and line
  removal. Confirmation dialogs are reserved for destructive-and-permanent
  actions only — deleting a Menu Category with items, removing a team member,
  cancelling an Order.
- **No modals on the Order Screen or the Driver list.** Ever.
- **Motion**: 150–200ms, ease-out, for state changes. The Savings Counter's
  800ms count-up is the single exception. Everything respects
  `prefers-reduced-motion`, which for the counter means the final value simply
  appears.
- **Idle behaviour**: the Order Screen never logs out on idle and never sleeps
  its live connection. Every other surface follows normal session rules.

## Accessibility Floor

WCAG 2.1 AA is the floor, with three commitments that go beyond it because of
where this product is used.

- **Contrast**: AA everywhere; AAA (7:1) on the Order Screen and the Driver list.
  Those are read at distance and in sunlight.
- **Never colour alone**: every Order Status carries a glyph and a word as well
  as its colour (DESIGN.md § Components).
- **Touch targets**: 48px minimum, 64px for the status-advance control.
- **Keyboard**: full traversal on every surface. The Menu editor is entirely
  keyboard-operable, since an owner entering forty items will use a laptop.
- **Focus**: a visible 2px `{colors.focus-ring}` ring, never removed. Focus moves
  to new content on route change and to the first error on a failed submit.
- **Screen readers**: form fields have real labels, not placeholders as labels.
  Order status changes announce via a polite live region. The Savings Counter
  announces once, as a full sentence, not as a bare number.
- **Text scaling**: layouts hold to 200% zoom without horizontal scrolling.
- **Language**: `lang` and `dir` set correctly per language, so a screen reader
  switches voice.

## Bilingual and RTL

Arabic is a first-class direction, not a translation layer.

- The entire layout mirrors in Arabic: navigation, card internals, table column
  order, icon direction, and the start/end of every row.
- **What never mirrors**: numerals, currency figures, phone numbers, email
  addresses, and the logo. A price is 45.00 in both directions.
- Logical CSS properties throughout (`margin-inline-start`, not
  `margin-left`) so mirroring is a single attribute rather than a second
  stylesheet.
- Language is chosen per User and persists to their Account. The Ordering Page
  instead follows the Diner's browser language, with a manual switch in the
  header — a Diner has no Account to remember.
- Menu Item text is whatever the Owner typed, in whichever language, and is never
  auto-translated.

## Responsive and Platform

- Breakpoints: 360 (floor), 768, 1024, 1280.
- **Designed at 360px first.** Any layout that needs more than 360px to work has
  a bug, not a breakpoint.
- The Ordering Page and the Driver list stay single-column at every width.
- The Order Screen grid: 1 column → 2 at 768 → 3 at 1280.
- The Owner Dashboard: single column → two at 1024. The Savings Counter spans
  full width at every breakpoint and is above the fold at 360px.
- Browser floor: last two versions of Chrome, Safari, Firefox, and Edge, plus
  Safari on iOS 15+ and Chrome on Android 10+. That Android floor is deliberate —
  kitchen tablets are old.
- Printing matters exactly once: the Table QR sheet must print correctly on A4
  from a phone.

## Key Flows

- **KF-1. Abu Khalid gets live before the evening rush.** *(realizes UJ-1)*
  Landing Page on his phone → *Start free* → three fields → he is on an empty
  Owner Dashboard whose only content is *Add your first menu item*. He adds nine
  items; each field saves on blur, so the delivery that interrupts him at item
  four costs nothing. He sets his Commission Assumption to 25% in Settings, then
  taps *Print table codes* and picks 12 tables.
  **Climax:** the PDF downloads and he sees his own restaurant's name above
  twelve numbered codes. The product has become a physical object he can tape to
  a table.
  **Resolution:** Ordering Page live; dashboard now shows the Savings Counter at
  zero, with the formula spelled out underneath.

- **KF-2. Nora orders from table 6 in under a minute.** *(realizes UJ-2)*
  Scans → the Ordering Page opens with dine-in and table 6 already set, and she
  never sees a mode selector at all. Two taps add two items; the Cart bar rises
  from the bottom. She types "no onions", enters her phone number, confirms.
  **Climax:** the status page replaces the form and moves to *cooking* within a
  minute — she can see the kitchen has it, and stops wondering whether to flag
  someone down.
  **Resolution:** phone down. The link stays valid for 24 hours.
  **Edge:** an item is sold out — greyed in place, labelled, not addable, not
  hidden.

- **KF-3. Yousef runs the pass on a Friday night.** *(realizes UJ-3)*
  The tablet is already on `/kitchen`; there is no navigation to leave it. A tone
  plays and a card highlights once. He reads it at a metre in `kitchen` type,
  taps the 64px control to *cooking*, and later *ready*.
  **Climax:** the card turns green and leaves the active list. The pass is clear
  and he has not touched anything else.
  **Edge:** wrong card — five seconds of inline undo, in the card's own space.

- **KF-4. Majed clears three deliveries without a phone call.** *(realizes UJ-4)*
  Opens `/deliveries` on his phone in the sun; AAA contrast is why he can read
  it. Address, tappable phone number, total, one button.
  **Climax:** *delivered* — the row collapses out of the list and the owner's
  dashboard updates without anyone being called.
  **Edge:** no answer → *problem*, which leaves the status alone and raises a
  flag at the top of the Owner Dashboard.

- **KF-5. Abu Khalid opens the dashboard on the first of the month.** *(realizes
  UJ-5 — the retention flow, and the reason this product is bought twice)*
  Phone, in bed. The first thing rendered above the fold is the Savings Counter,
  counting up once from zero to *"You kept 8,740 AED last month."* Underneath, in
  small plain text, the arithmetic that produced it.
  **Climax:** he screenshots it.
  **Resolution:** he renews without a sales conversation, and sends the
  screenshot to his brother who owns a bakery.

## Open Questions

1. Should Staff have individual logins, or does one shared kitchen-device login
   match how these kitchens actually work? (PRD §10 Q4 — this is an experience
   question before it is a security one.)
2. Does requiring the Diner's phone number cost orders? It is the foundation of
   the Customer List, so removing it would remove the v2 story.
3. Is a sound enough for a new order in a genuinely loud kitchen, or does the
   Order Screen need a visual flash at the screen edge?
4. When a Restaurant is closed, should the Ordering Page accept pre-orders for
   opening time, or stay firmly shut?
