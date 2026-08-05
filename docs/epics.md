---
stepsCompleted: [design-epics, create-stories, coverage-validation]
inputDocuments:
  - ./prd.md
  - ./DESIGN.md
  - ./EXPERIENCE.md
  - ./architecture.md
---

# MyMenu — Epic Breakdown

## Overview

This document decomposes the requirements in [`prd.md`](./prd.md) into nine
epics and forty implementable stories, constrained by
[`architecture.md`](./architecture.md) and specified visually and behaviourally
by [`DESIGN.md`](./DESIGN.md) and [`EXPERIENCE.md`](./EXPERIENCE.md).

**Ordering principle: the demo path is built first.** Epics 1 → 6 assemble the
single narrative a viewer must be able to watch end to end — sign up, build a
menu, scan, order, cook, and see the money saved. Everything required but not on
that path (settings, support, the landing page) follows in Epics 7 and 8, and
Epic 9 exists purely to make the presentation reproducible.

## Requirements Inventory

### Functional Requirements

FR-1 Restaurant signup · FR-2 Login · FR-3 Password reset · FR-4 Logout ·
FR-5 Owner invites Staff and Drivers · FR-6 Role-based access ·
FR-7 Public landing page · FR-8 Savings estimator ·
FR-9 Manage Menu Categories · FR-10 Manage Menu Items · FR-11 Toggle
availability · FR-12 Printable Table QRs ·
FR-13 Browse the Menu · FR-14 Build a Cart · FR-15 Choose a Fulfilment Mode ·
FR-16 Place an Order · FR-17 Watch Order status ·
FR-18 View today's Orders · FR-19 New Order alert · FR-20 Advance Order Status ·
FR-21 Assign an Order to a Driver · FR-22 Driver list and completion ·
FR-23 Today at a glance · FR-24 Savings Counter · FR-25 Customer List ·
FR-26 Order history ·
FR-27 Account profile · FR-28 Preferences · FR-29 Security ·
FR-30 Restaurant settings ·
FR-31 FAQs · FR-32 Contact form · FR-33 Support entry points

### Non-Functional Requirements

- **NFR-1 Tenancy isolation** — no restaurant can read another's data by any
  route (AD-1).
- **NFR-2 Live latency** — order events reach the Order Screen, Driver list, and
  Diner status page within 5 seconds (AD-7).
- **NFR-3 Kitchen legibility** — AAA contrast, 22px minimum text, 48px minimum
  targets on the Order Screen and Driver list.
- **NFR-4 Monetary exactness** — integer minor units end to end (AD-6).
- **NFR-5 Bilingual parity** — every string in Arabic and English, full RTL
  mirroring (AD-10, AD-11).
- **NFR-6 Mobile floor** — every surface works at 360px with no horizontal
  scroll.

### Architectural Requirements

AD-1 database-enforced tenancy · AD-2 order line snapshots · AD-3 Diner is never
authenticated · AD-4 forward-only status with an event log · AD-5 savings
computed never stored · AD-6 integer money · AD-7 realtime with polling
fallback · AD-8 server components by default · AD-9 two Supabase clients,
secrets server-only · AD-10 logical CSS properties · AD-11 dictionary-sourced
strings.

### UX Design Requirements

Key flows KF-1 … KF-5 from [`EXPERIENCE.md`](./EXPERIENCE.md); the five-state
matrix (empty / loading / error / offline / success) per surface; two navigation
shapes (Owner browses, Staff and Driver do not); undo over confirm; no modals on
the Order Screen or Driver list.

### FR Coverage Map

| FR | Story |
|---|---|
| FR-1 | 1.3 |
| FR-2 | 1.4 |
| FR-3 | 1.5 |
| FR-4 | 1.6 |
| FR-5 | 1.7 |
| FR-6 | 1.2, 1.8 |
| FR-7 | 8.1 |
| FR-8 | 8.2 |
| FR-9 | 2.1 |
| FR-10 | 2.2, 2.3 |
| FR-11 | 2.4 |
| FR-12 | 2.5 |
| FR-13 | 3.1 |
| FR-14 | 3.2 |
| FR-15 | 3.3 |
| FR-16 | 3.4 |
| FR-17 | 3.5 |
| FR-18 | 4.1 |
| FR-19 | 4.2 |
| FR-20 | 4.3 |
| FR-21 | 5.1 |
| FR-22 | 5.2 |
| FR-23 | 6.1 |
| FR-24 | 6.2 |
| FR-25 | 6.3 |
| FR-26 | 6.4 |
| FR-27 | 7.1 |
| FR-28 | 7.2 |
| FR-29 | 7.3 |
| FR-30 | 7.4 |
| FR-31 | 8.3 |
| FR-32 | 8.4 |
| FR-33 | 8.5 |

All 33 FRs are covered. Stories 1.1, 4.4, and Epic 9 carry no FR: 1.1 is the
build enabler, 4.4 implements the failure state EXPERIENCE.md marks as
load-bearing, and Epic 9 serves the presentation, which is a graded deliverable
in its own right.

## Epic List

| # | Epic | Delivers |
|---|---|---|
| 1 | Foundation and Access | A deployed, empty app people can sign into with the right role |
| 2 | The Menu | An owner can build a menu and print table codes |
| 3 | The Diner Orders | A stranger can scan and order without an account |
| 4 | The Kitchen | Staff see and advance orders live |
| 5 | Own-Driver Handoff | Delivery orders reach the restaurant's own driver |
| 6 | The Money Story | The dashboard, and the number the whole pitch rests on |
| 7 | Account, Settings, and Arabic | Required pages, plus full bilingual support |
| 8 | The Front Door | Landing page, estimator, FAQs, working contact form |
| 9 | Demo Ready | Seed data, production deploy, presentation |

---

## Epic 1: Foundation and Access

Stand up the project, the database, and the tenancy boundary, then let the three
roles in. Nothing else can be built or trusted until AD-1 is real, so it lands
in story 1.2 rather than at the end.

### Story 1.1: Project skeleton and deployment pipeline

As a developer,
I want the app scaffolded and deploying automatically,
So that every later story ships to a real URL instead of a laptop.

**Acceptance Criteria:**

**Given** an empty repository,
**When** the scaffold is committed and pushed to GitHub,
**Then** Vercel builds it and serves a placeholder page at a public URL,
**And** the DESIGN.md tokens exist as Tailwind theme values,
**And** IBM Plex Sans Arabic loads for both Arabic and Latin text,
**And** `lib/env.ts` fails the boot loudly if any required variable is missing.

### Story 1.2: Database schema and the tenancy boundary

As an owner of any restaurant,
I want my data to be unreachable by any other restaurant,
So that the product is safe to sell.

**Acceptance Criteria:**

**Given** the migrations in `supabase/migrations/`,
**When** they are applied,
**Then** every table from architecture.md exists with `restaurant_id`,
`created_at`, and RLS enabled,
**And** a policy scopes every table to the requester's restaurant,
**And** a test signed in as restaurant A receives zero rows when querying
restaurant B's orders, menu items, and customers by explicit id,
**And** the `customers` view returns distinct diner phone numbers with order
count and last-order date.

### Story 1.3: Restaurant signup

As a restaurant owner,
I want to create an account and my restaurant in one step,
So that I can start in the gap between lunch and dinner. *(KF-1)*

**Acceptance Criteria:**

**Given** a visitor on `/signup`,
**When** they submit email, password, password confirmation, and restaurant name,
**Then** a `restaurants` row and an owner `profiles` row are both created,
**And** they land authenticated on `/dashboard` showing the empty state
"Add your first menu item".

**Given** a password shorter than 8 characters,
**When** they attempt to submit,
**Then** an inline message appears and no request is sent.

**Given** an email that already has an account,
**When** they submit,
**Then** the message reads "That email already has an account — sign in
instead?" with a link, and reveals nothing further.

### Story 1.4: Login and role routing

As a user of any role,
I want to sign in and land where I work,
So that I never navigate to my own job.

**Acceptance Criteria:**

**Given** valid credentials,
**When** an owner, a staff member, and a driver each sign in,
**Then** they arrive at `/dashboard`, `/kitchen`, and `/deliveries`
respectively.

**Given** a wrong email or a wrong password,
**When** either is submitted,
**Then** the same generic failure message appears in both cases.

**Given** an authenticated session,
**When** the browser is refreshed or the tab is closed and reopened,
**Then** the session persists.

### Story 1.5: Password reset

As a user who cannot sign in,
I want a reset link by email,
So that a forgotten password does not cost a service.

**Acceptance Criteria:**

**Given** any email address submitted on `/forgot`,
**When** it is submitted,
**Then** the same confirmation appears whether or not an account exists.

**Given** a reset link,
**When** it is used more than once, or more than 60 minutes after issue,
**Then** it is rejected with an explanation and an offer to request another.

**Given** a successful reset,
**When** it completes,
**Then** every other session for that user is invalidated.

### Story 1.6: Logout

As any authenticated user,
I want to sign out,
So that a shared kitchen tablet does not stay open on my account.

**Acceptance Criteria:**

**Given** an authenticated user on any surface,
**When** they sign out,
**Then** any authenticated URL redirects to `/login` on the next request.

### Story 1.7: Owner adds and removes staff and drivers

As an owner,
I want to add my staff and drivers myself,
So that nobody creates their own login into my restaurant. *(FR-5)*

**Acceptance Criteria:**

**Given** an owner on `/team`,
**When** they add an email and choose staff or driver,
**Then** an invitation email is sent and the invitee sets their own password
from the link.

**Given** a removed user,
**When** they make their next request,
**Then** their session stops working.

**Given** an owner who is the only owner,
**When** they attempt to remove themselves,
**Then** the action is blocked with an explanation.

### Story 1.8: Role-based access enforcement

As the business,
I want each role limited to its own surfaces,
So that a curious staff member cannot open the books.

**Acceptance Criteria:**

**Given** a signed-in staff member,
**When** they request `/dashboard`, `/customers`, or `/team` directly by URL,
**Then** they receive a 403 page with a link back to `/kitchen` — not a redirect
loop and not a blank screen.

**Given** a signed-in driver,
**When** they request an order not assigned to them,
**Then** it is not returned.

---

## Epic 2: The Menu

The moment the product becomes real for an owner. Every field saves on blur, so
an interruption costs nothing — this pattern is the whole answer to KF-1's edge
case and is implemented once, in story 2.2.

### Story 2.1: Manage menu categories

As an owner,
I want to group my menu into sections,
So that a diner can find things.

**Acceptance Criteria:**

**Given** an owner on `/menu`,
**When** they create, rename, reorder, or delete a category,
**Then** the change is saved without a save button and appears on the Ordering
Page immediately.

**Given** a category containing items,
**When** deletion is requested,
**Then** a confirmation names the number of items that will be deleted with it.

### Story 2.2: Manage menu items

As an owner,
I want to add my dishes with prices,
So that my menu exists. *(KF-1)*

**Acceptance Criteria:**

**Given** an owner editing an item's name, description, or price,
**When** the field loses focus,
**Then** it saves, the border flashes `{colors.accent}` for 400ms, and there is
no save button anywhere on the page.

**Given** the browser is closed mid-entry,
**When** the owner returns,
**Then** every completed field is present.

**Given** a price input,
**When** a negative number or more than two decimals is entered,
**Then** it is rejected inline; stored values are integer halalas.

### Story 2.3: Menu item photos

As an owner,
I want a photo on a dish,
So that it sells itself.

**Acceptance Criteria:**

**Given** an owner uploading an image,
**When** the upload completes,
**Then** it is stored in Supabase Storage, resized server-side, and the Ordering
Page never downloads the original.

**Given** an item with no photo,
**When** the Ordering Page renders,
**Then** a neutral placeholder block appears — never a broken-image icon.

### Story 2.4: Availability toggle

As staff during a rush,
I want to mark a dish sold out in one tap,
So that we stop taking orders we cannot cook.

**Acceptance Criteria:**

**Given** a staff member or owner tapping the toggle,
**When** it is tapped,
**Then** it flips instantly, and reverts with a message only if the write fails.

**Given** an unavailable item,
**When** a diner views the Ordering Page,
**Then** it appears greyed in place with a "sold out" pill and cannot be added —
it is never hidden.

**Given** an order already containing that item,
**When** availability changes,
**Then** the order is unaffected.

### Story 2.5: Printable table QR sheet

As an owner,
I want printable codes for my tables,
So that the product becomes something I can tape to a table. *(KF-1 climax)*

**Acceptance Criteria:**

**Given** an owner who chooses a number of tables,
**When** they generate the sheet,
**Then** a PDF downloads with the restaurant's name and that many numbered
codes, each at least 4cm square, printing correctly on A4.

**Given** code number 6 is scanned,
**When** the page opens,
**Then** the Ordering Page loads with fulfilment mode dine-in and table 6
preset, and no mode selector is shown.

---

## Epic 3: The Diner Orders

The public surface. No account, no app, no download (AD-3). Success is measured
in seconds: scan to confirmed under 60 (SM-4).

### Story 3.1: Public ordering page

As a diner,
I want to see the menu the moment I scan,
So that I do not have to ask anyone for anything. *(KF-2)*

**Acceptance Criteria:**

**Given** an unauthenticated visitor at `/r/{slug}`,
**When** the page loads,
**Then** the menu renders in the owner's category order with no login prompt at
any point.

**Given** a restaurant with an empty menu,
**When** the page loads,
**Then** it reads "This restaurant isn't taking orders yet" — calm, not an
error.

**Given** a restaurant outside its opening hours,
**When** the page loads,
**Then** it shows "Closed — opens at {time}" and does not accept orders.

### Story 3.2: Cart

As a diner,
I want to collect what I want before committing,
So that I can change my mind.

**Acceptance Criteria:**

**Given** an item added to the cart,
**When** the cart becomes non-empty,
**Then** the cart bar rises from the bottom edge once and persists while
scrolling.

**Given** quantity or removal changes,
**When** they are made,
**Then** the total recalculates to the exact sum of line items in integer
halalas, and a removal offers a five-second undo.

**Given** the page is refreshed or the phone rings,
**When** the diner returns,
**Then** the cart is intact.

**Given** a per-item note,
**When** it exceeds 200 characters,
**Then** further input is prevented with a visible count.

### Story 3.3: Choose a fulfilment mode

As a diner,
I want to say how I am getting the food,
So that I am only asked for what is relevant.

**Acceptance Criteria:**

**Given** dine-in,
**When** it is chosen or preset by a table QR,
**Then** a table number is required and prefilled where known.

**Given** pickup,
**When** it is chosen,
**Then** nothing beyond the phone number is required.

**Given** delivery,
**When** it is chosen,
**Then** a text address is required.

**Given** an owner who has turned delivery off in settings,
**When** the diner reaches the mode choice,
**Then** delivery is not offered at all.

### Story 3.4: Place an order

As a diner,
I want to confirm and be done,
So that I can put my phone down. *(KF-2)*

**Acceptance Criteria:**

**Given** a valid cart and phone number,
**When** the diner confirms,
**Then** an order is created with status `received` and an unguessable
22-character `order_ref`,
**And** each line stores the item name and unit price as they were at
confirmation.

**Given** a later edit to a menu item's name or price,
**When** the past order is viewed,
**Then** it shows the original values.

**Given** a double submission,
**When** confirm is pressed twice,
**Then** exactly one order exists.

### Story 3.5: Watch order status

As a diner,
I want to see that the kitchen has my order,
So that I stop wondering whether to flag someone down. *(KF-2 climax)*

**Acceptance Criteria:**

**Given** a placed order,
**When** the status page opens,
**Then** it replaces the form and shows the current status.

**Given** staff advancing the status,
**When** they do,
**Then** the diner's page updates within 5 seconds without a refresh.

**Given** 24 hours have passed,
**When** the link is opened,
**Then** it has expired.

---

## Epic 4: The Kitchen

One screen, no navigation, no modals, no swipe. Story 4.4 is not optional
polish: a kitchen that silently stops receiving orders is the failure that would
lose a paying customer permanently.

### Story 4.1: Today's orders

As kitchen staff,
I want today's orders on one screen,
So that I never navigate during a rush. *(KF-3)*

**Acceptance Criteria:**

**Given** a signed-in staff member,
**When** `/kitchen` loads,
**Then** today's active orders render newest first, each card showing order
number, fulfilment mode, table or address, line items, notes, total, and elapsed
time.

**Given** the DESIGN.md kitchen rules,
**When** any text on this surface is measured,
**Then** none is below 22px, contrast meets AAA, and the advance control is at
least 64px tall.

**Given** completed or cancelled orders,
**When** the list renders,
**Then** they are absent from the active list.

**Given** no active orders,
**When** the screen loads,
**Then** it reads "No active orders" — large and calm, not styled as an error.

### Story 4.2: New order alert

As kitchen staff,
I want to know an order arrived without watching the screen,
So that nothing waits.

**Acceptance Criteria:**

**Given** a diner confirming an order,
**When** it is created,
**Then** the card appears on the Order Screen within 5 seconds with one 300ms
highlight and a short tone.

**Given** the sound control,
**When** it is muted,
**Then** the preference persists for that device, not for the account.

### Story 4.3: Advance order status

As kitchen staff,
I want one tap per step,
So that my hands stay on the food. *(KF-3)*

**Acceptance Criteria:**

**Given** an order card,
**When** the advance control is tapped,
**Then** the status moves forward one step with no confirmation dialog, and an
undo occupies the card's own space for five seconds.

**Given** a card at `ready`,
**When** it advances,
**Then** it turns green and leaves the active list.

**Given** a staff member,
**When** they attempt to move a status backward or cancel,
**Then** it is refused by the database, not only hidden in the UI; only an owner
may do either.

**Given** any transition,
**When** it completes,
**Then** a row is appended to `order_events` recording actor and timestamp.

### Story 4.4: Connection loss is impossible to miss

As kitchen staff,
I want to be told loudly if orders have stopped arriving,
So that I never mistake a broken connection for a quiet night.

**Acceptance Criteria:**

**Given** the realtime channel drops,
**When** polling still succeeds,
**Then** updates continue and nothing is shown to the user.

**Given** both realtime and polling fail,
**When** the failure persists,
**Then** a persistent banner reads "Not receiving new orders" and an audible
alert repeats every 60 seconds until connectivity returns.

**Given** connectivity returns,
**When** it does,
**Then** any orders created during the outage appear.

---

## Epic 5: Own-Driver Handoff

We route the order to the restaurant's existing driver and stop. No map, no
route optimisation, no driver marketplace.

### Story 5.1: Assign an order to a driver

As an owner or staff member,
I want to hand a delivery to our driver,
So that nobody shouts an address across the kitchen.

**Acceptance Criteria:**

**Given** an order with fulfilment mode delivery,
**When** a driver is chosen,
**Then** it appears on that driver's list within 5 seconds.

**Given** an order with mode dine-in or pickup,
**When** assignment is attempted,
**Then** it is not offered.

**Given** a reassignment,
**When** it is made,
**Then** the order disappears from the previous driver's list.

### Story 5.2: Driver list and completion

As a driver,
I want my deliveries and one button,
So that I can work with one hand in the sun. *(KF-4)*

**Acceptance Criteria:**

**Given** a signed-in driver,
**When** `/deliveries` loads,
**Then** only their assigned orders appear, each showing address, a tappable
phone number, and total, at AAA contrast.

**Given** the delivered button,
**When** it is tapped,
**Then** the order status becomes `completed` and the row collapses out of the
list.

**Given** the problem button,
**When** it is tapped,
**Then** the status is unchanged and a flag with its reason appears at the top of
the owner's dashboard.

---

## Epic 6: The Money Story

The reason a restaurant renews, and the centre of the pitch. Story 6.2 is the
single most important story in this document.

### Story 6.1: Today at a glance

As an owner,
I want today's numbers without adding anything up,
So that I know how the day went.

**Acceptance Criteria:**

**Given** an owner on `/dashboard`,
**When** it loads,
**Then** today's order count and revenue appear for the restaurant's own
timezone, excluding cancelled orders.

**Given** a flagged order,
**When** the dashboard loads,
**Then** it appears at the top with its flag reason.

### Story 6.2: The savings counter

As an owner,
I want to see what I did not pay in commission,
So that renewing is not a decision. *(KF-5)*

**Acceptance Criteria:**

**Given** completed orders in the current month,
**When** the dashboard loads,
**Then** the counter shows (month's completed order totals ×
commission assumption) − the monthly fee, never below zero, computed on read and
stored nowhere.

**Given** a 360px-wide phone,
**When** the dashboard loads,
**Then** the counter is above the fold, in `display` type on
`{colors.accent-wash}`, with the arithmetic stated in plain language beneath it.

**Given** the first paint of a session,
**When** the counter renders,
**Then** it counts up from zero once over roughly 800ms — and with
`prefers-reduced-motion`, the final value simply appears.

**Given** the domain function,
**When** the test suite runs,
**Then** unit tests cover zero orders, a partial month, a value below the fee,
and rounding at the halala.

### Story 6.3: Customer list

As an owner,
I want the list of people who order from me,
So that I own the relationship the delivery apps hid.

**Acceptance Criteria:**

**Given** orders from repeat phone numbers,
**When** `/customers` loads,
**Then** each number appears once with its order count and last-order date,
sortable by both.

**Given** the export action,
**When** it is used,
**Then** a CSV downloads containing only this restaurant's customers.

**Given** no orders yet,
**When** the page loads,
**Then** it reads "No customers yet — they appear after the first order."

### Story 6.4: Order history

As an owner,
I want to look up a past order,
So that I can settle an argument about what was sent.

**Acceptance Criteria:**

**Given** a date range and an optional fulfilment mode filter,
**When** applied,
**Then** matching past orders list with their totals.

**Given** a past order is opened,
**When** it renders,
**Then** it shows the line items and prices recorded at the time (AD-2).

---

## Epic 7: Account, Settings, and Arabic

The required pages, plus the bilingual work. Arabic lands here as a full story
rather than as a task inside every other story, so that parity is testable in
one place.

### Story 7.1: Account profile

As any user,
I want to manage my own details,
So that my account is mine.

**Acceptance Criteria:**

**Given** a user on `/settings`,
**When** they edit their name,
**Then** it saves.

**Given** an email change,
**When** submitted,
**Then** the current password is required.

**Given** the role field,
**When** the page renders,
**Then** it is read-only.

### Story 7.2: Language and Arabic parity

As an Arabic-speaking owner,
I want the whole product in Arabic,
So that it feels made for me and not translated at me.

**Acceptance Criteria:**

**Given** the language switch,
**When** Arabic is chosen,
**Then** the interface changes immediately without a reload and the choice
persists to the account across devices.

**Given** Arabic,
**When** any surface renders,
**Then** the layout mirrors — navigation, card internals, table column order,
row start and end — while numerals, currency, phone numbers, email addresses,
and the logo do not mirror.

**Given** the build,
**When** a key exists in `en.ts` but not `ar.ts` or vice versa,
**Then** the build fails.

**Given** the Ordering Page and a diner with no account,
**When** it loads,
**Then** it follows the browser language, with a manual switch in the header.

### Story 7.3: Security

As any user,
I want to change my password and see where I am signed in,
So that I can clean up after a shared tablet.

**Acceptance Criteria:**

**Given** a password change,
**When** submitted with the current password,
**Then** it succeeds and all other sessions are signed out.

**Given** the sessions list,
**When** it renders,
**Then** each shows device, approximate location, and last-used time.

### Story 7.4: Restaurant settings

As an owner,
I want to set how my restaurant runs,
So that the product matches my shop.

**Acceptance Criteria:**

**Given** restaurant name, opening hours, address, phone, commission assumption,
and delivery on or off,
**When** each is changed,
**Then** it saves and takes effect immediately.

**Given** delivery turned off,
**When** a diner opens the Ordering Page,
**Then** delivery is not among the fulfilment modes.

**Given** a commission assumption of 25%,
**When** the dashboard loads,
**Then** the savings counter uses it, and defaults to 25% when never set.

---

## Epic 8: The Front Door

The public pages. Built after the demo path because the landing page's copy is
easier to write once the product it describes exists.

### Story 8.1: Landing page

As a restaurant owner who has never heard of this,
I want to understand it in ten seconds,
So that I try it.

**Acceptance Criteria:**

**Given** any visitor,
**When** `/` loads,
**Then** it renders fully signed-out with no flash of a login screen, readable
and usable at 360px.

**Given** the page,
**When** it renders,
**Then** it offers exactly one primary action, "Start free", and one secondary,
"See a live demo menu", which opens a sample Ordering Page.

### Story 8.2: Savings estimator

As a restaurant owner,
I want to see my own number,
So that the claim stops being abstract.

**Acceptance Criteria:**

**Given** monthly delivery sales of 30,000 at the default 25%,
**When** entered,
**Then** the page shows a yearly cost of 90,000 SAR.

**Given** typing,
**When** each keystroke lands,
**Then** the figure updates with no page reload.

**Given** non-numeric input,
**When** entered,
**Then** no NaN or Infinity is ever displayed.

**Given** the calculation,
**When** it runs,
**Then** it calls the same `lib/domain/savings.ts` function as the dashboard.

### Story 8.3: FAQs

As anyone,
I want my obvious question answered without emailing,
So that I do not have to wait.

**Acceptance Criteria:**

**Given** `/support`,
**When** it loads unauthenticated,
**Then** at least 8 FAQ entries render, expandable, in both Arabic and English.

### Story 8.4: Contact form that really sends

As anyone with a question,
I want a form that actually reaches a human,
So that I trust the company behind it.

**Acceptance Criteria:**

**Given** name, email, subject, and body,
**When** submitted,
**Then** an email containing all four arrives at the support inbox and the
sender receives an automatic acknowledgement.

**Given** submission,
**When** it succeeds or fails,
**Then** an explicit state is shown — never silence — and on failure the typed
message is preserved.

**Given** an authenticated user,
**When** the form loads,
**Then** name and email are prefilled.

**Given** automated submissions,
**When** they arrive,
**Then** a honeypot field and per-IP rate limiting reject them.

### Story 8.5: Support reachable from everywhere

As any signed-in user,
I want help one tap away,
So that I never have to search for it.

**Acceptance Criteria:**

**Given** any authenticated surface, including `/kitchen` and `/deliveries`,
**When** it renders,
**Then** a support entry point is present in the header without adding
navigation to the kitchen or driver surfaces.

---

## Epic 9: Demo Ready

Not product work — presentation work. It is here because the presentation and
demo are graded deliverables, and a demo that breaks in the room costs more than
a missing feature.

### Story 9.1: Seed a believable demo restaurant

As the presenter,
I want a restaurant with a real-looking history,
So that the savings counter shows a meaningful number on the day.

**Acceptance Criteria:**

**Given** the seed script run against the dev database,
**When** it completes,
**Then** a demo restaurant exists with a full menu, photos, and a month of
completed orders producing a savings figure in the thousands,
**And** it never runs against production.

### Story 9.2: Production deploy and the live link

As the presenter,
I want a public URL that works on someone else's phone,
So that the investor can try it.

**Acceptance Criteria:**

**Given** `main`,
**When** it is pushed,
**Then** Vercel deploys to production against the production Supabase project.

**Given** the live URL on a phone not used in development,
**When** the demo path is walked — landing, signup, menu, scan, order, kitchen,
dashboard —
**Then** every step works, and the page is readable in Arabic and English.

### Story 9.3: The presentation

As the presenter,
I want the pitch prepared before the demo,
So that the room understands the problem before seeing the solution.

**Acceptance Criteria:**

**Given** the deck,
**When** it is reviewed,
**Then** it covers the problem, who feels it, the solution, the market, how it
makes money, the amount asked for, and what the investor gets — in that order.

**Given** the commission figure used throughout,
**When** the deck is finalised,
**Then** it cites a rate quoted by a real restaurant owner, not an assumption
(PRD §10 Q1).
