---
title: MyMenu
created: 2026-08-05
updated: 2026-08-05
---

# PRD: MyMenu

## 0. Document Purpose

This PRD is the working specification for MyMenu — what gets built, for whom,
and how we know it worked. It is written for the project manager and for the
downstream workflows that consume it (UX, architecture, epics, sprint planning).
It builds on [`product-brief.md`](./product-brief.md), which carries the
investor-facing story; this document does not repeat that story, it makes it
buildable.

Structure: vocabulary is fixed in §3 Glossary and used verbatim everywhere else.
Features in §4 each carry nested, globally-numbered functional requirements
(FR-1 … FR-33) so epics and stories can reference them even if features get
reorganised. Inferences made without confirmation are tagged `[ASSUMPTION]`
inline and collected in §11.

## 1. Vision

A small restaurant sells a 60 AED meal through a delivery app and keeps roughly
42 of it. Worse, it never learns who bought the meal. The customer belongs to the
platform, and reaching that customer again costs commission again. The
restaurant is renting people who already like its food.

MyMenu gives a restaurant its own ordering page — its own menu, its own QR code
on the table, its own kitchen screen, and its own customer list — for a flat
monthly fee that does not grow when the restaurant grows. Diners scan, order, and
watch the food get made. Staff work one uncluttered screen. The owner sees a
live counter of the commission they did not pay this month.

We are not a delivery company and we are not trying to beat Talabat at discovery.
Talabat brings a restaurant strangers; MyMenu keeps the people who already came.
Most restaurants should run both, and saying so out loud is what makes the pitch
credible.

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional** — take an order accurately without paper, WhatsApp screenshots,
  or a phone call back to confirm.
- **Functional** — know today's orders and today's revenue without adding it up.
- **Financial** — stop paying a percentage on customers who were already loyal.
- **Financial** — own a customer list that can be contacted without paying a fee.
- **Social** — look modern to diners. A QR menu signals a run-well restaurant.
- **Emotional** — feel in control of the business again, rather than a supplier
  to a platform that sets the terms.
- **Contextual** — everything above has to work during a Friday-night rush, on a
  cheap phone, with flour on someone's hands.

### 2.2 Non-Users (v1)

- Large chains with existing POS integrations and an IT department.
- Cloud kitchens whose entire demand comes from platform discovery — they have
  no existing customer base to retain, so our core value does not apply.
- Diners looking to *discover* a new restaurant. MyMenu is opened because you
  already chose the restaurant.

### 2.3 Key User Journeys

- **UJ-1. Abu Khalid signs up on a slow Tuesday and is live before the evening
  rush.** He owns a 40-seat grill and can quote his commission rate from memory
  because he checks it every month. Unauthenticated, on the Landing Page, on his
  phone. He taps *Start free*, enters his email and a password, confirms it, and
  lands on an empty Owner Dashboard with one thing on it: *Add your first menu
  item*. He adds nine items in about twenty minutes, sets his Commission
  Assumption to 25%, and taps *Print table codes*. **Climax:** a PDF of numbered
  QR codes downloads; he prints it on the office printer and tapes them to the
  tables. **Resolution:** the Ordering Page is live at his own link and the first
  table scan happens that night. **Edge case:** he closes the browser mid-menu —
  every item saves as he goes, so returning drops him back where he stopped.

- **UJ-2. Nora orders from table 6 without waving at anyone.** She is a diner,
  unauthenticated, and will never create an Account. She scans the QR taped to
  her table; the Ordering Page opens with Fulfilment Mode already set to
  **dine-in** and Table Number already 6, because the QR carried both. She picks
  two items, types "no onions" in the note, enters her phone number, and
  confirms. **Climax:** a status page appears and moves to *cooking* within a
  minute — she can see the kitchen has her order. **Resolution:** she puts the
  phone down and waits. **Edge case:** an item she wants is toggled unavailable —
  it renders greyed with *sold out* and cannot be added to the Cart.

- **UJ-3. Yousef runs the pass on a Friday night.** Kitchen staff, authenticated
  with a Staff role, on a tablet propped by the pass. He sees only the Order
  Screen: today's Orders, newest first, each a large card. A new one arrives with
  a sound. He taps *cooking*, and later *ready*. **Climax:** the card turns green
  and leaves the active list — the pass is clear. **Resolution:** he never opens
  another page all night. **Edge case:** he taps *ready* on the wrong Order; a
  five-second undo is available on the card.

- **UJ-4. Majed delivers three orders without a phone call.** Majed is the
  restaurant's own driver — a Driver role. The owner assigns him two Orders. On
  his phone he sees a short list: address, phone, order total, and one button,
  *delivered*. **Climax:** he taps *delivered*; the owner's dashboard reflects it
  instantly and the customer's status page updates. **Resolution:** the kitchen
  never has to ask him where he is. **Edge case:** the customer does not answer;
  he taps *problem*, which flags the Order on the owner's dashboard.

- **UJ-5. Abu Khalid opens the dashboard on the first of the month.** He is
  authenticated, on his phone, in bed. The first thing on the screen is the
  Savings Counter: *"You kept 8,740 AED last month."* Below it, the month's
  revenue and Order count. **Climax:** he screenshots it and sends it to his
  brother, who owns a bakery. **Resolution:** he renews without thinking about
  it, and we get a referral. This journey is the retention mechanism and the
  reason FR-24 is not a nice-to-have.

## 3. Glossary

- **Restaurant** — the paying tenant. Owns exactly one location in v1, one Menu,
  one Ordering Page, and one set of Users.
- **User** — a person with an Account belonging to exactly one Restaurant. Every
  User has exactly one Role.
- **Role** — one of **Owner**, **Staff**, **Driver**. Determines which Home
  surface the User sees after login and what they may do.
- **Account** — the credentials and profile of a User: email, password, name,
  language, notification preferences.
- **Diner** — a person who places an Order. Has no Account and never signs in.
  Identified only by the phone number given at checkout.
- **Menu** — the Restaurant's collection of Menu Categories.
- **Menu Category** — a named, ordered group of Menu Items (e.g. *Grills*).
- **Menu Item** — one sellable thing: name, description, price, optional photo,
  and an availability flag.
- **Ordering Page** — the public page at the Restaurant's own link where a Diner
  browses the Menu and places an Order. No login.
- **Table QR** — a printable code that opens the Ordering Page with Fulfilment
  Mode preset to dine-in and a Table Number attached.
- **Cart** — the Diner's in-progress selection before confirmation. Not an Order.
- **Order** — a confirmed purchase. Carries line items, total, Fulfilment Mode,
  Diner phone, optional note, Order Status, and timestamps.
- **Fulfilment Mode** — one of **dine-in**, **pickup**, **delivery**. Chosen by
  the Diner; determines which extra fields are required.
- **Order Status** — one of **received**, **cooking**, **ready**, **completed**,
  **cancelled**. Moves forward only, except by an Owner.
- **Order Screen** — the Staff surface listing today's active Orders.
- **Owner Dashboard** — the Owner's Home surface: Savings Counter, today's
  Orders and revenue, and entry points to the Menu editor and Customer List.
- **Savings Counter** — the headline figure on the Owner Dashboard: the
  commission the Restaurant did not pay this month. Defined in FR-24.
- **Commission Assumption** — the percentage, set by the Owner in Settings, that
  the Savings Counter uses. Default 25%.
- **Customer List** — the distinct Diner phone numbers that have ordered from
  this Restaurant, with order count and last-order date.
- **Subscription** — the Restaurant's flat monthly fee. Has a Plan and a status.

## 4. Features

### 4.1 Accounts and Access

**Description:** Every User signs in with an email and password and is scoped to
one Restaurant. Signing up creates the Restaurant and makes the signer its Owner;
Staff and Drivers are added afterwards by the Owner and never self-register —
a kitchen is not a place where people should be able to create their own logins.
Realizes UJ-1, UJ-3, UJ-4. `[ASSUMPTION: email/password is acceptable; no SMS
OTP in v1, which matters because restaurant staff turnover is high and email may
not be natural for them.]`

**Functional Requirements:**

#### FR-1: Restaurant signup

A visitor can create an Account with email, password, restaurant name, and
password confirmation, which creates a Restaurant and assigns them the Owner
Role. Realizes UJ-1.

**Consequences (testable):**
- A Restaurant and an Owner User both exist after one successful submission.
- Passwords under 8 characters are rejected before submission with an inline
  message.
- A duplicate email returns "this email already has an account" and offers the
  login link, without revealing anything else.
- The new Owner lands on the Owner Dashboard already authenticated.

#### FR-2: Login

A User can sign in with email and password and is routed to the Home surface for
their Role.

**Consequences (testable):**
- Owner → Owner Dashboard; Staff → Order Screen; Driver → Driver list.
- A wrong email and a wrong password produce the same generic failure message.
- The session survives a browser refresh and closing the tab.

#### FR-3: Password reset

A User who cannot sign in can request a reset link by email and set a new
password from it.

**Consequences (testable):**
- Submitting any address shows the same confirmation, whether or not an Account
  exists, so the form cannot be used to discover accounts.
- The link expires after 60 minutes and is single-use.
- After a successful reset, all other sessions for that User are invalidated.

#### FR-4: Logout

A User can end their session from any authenticated surface.

**Consequences (testable):**
- After logout, any authenticated URL redirects to login.

#### FR-5: Owner invites Staff and Drivers

An Owner can add a User to their Restaurant by email and Role, and can remove
one.

**Consequences (testable):**
- The invited person sets their own password via an emailed link.
- A removed User's session stops working on their next request.
- An Owner cannot remove themselves if they are the only Owner.

#### FR-6: Role-based access

The system restricts every surface and action to the Roles permitted to use it.

**Consequences (testable):**
- Staff requesting the Owner Dashboard URL directly get a 403, not a redirect
  loop and not a blank page.
- A Driver can read only Orders assigned to them.
- No User can read any data belonging to another Restaurant, by any URL.

### 4.2 Landing Page

**Description:** The public front door, written for a restaurant owner and not
for a diner. It leads with the number — what commission costs a restaurant per
year — and asks for one thing: start free. It is the only page that has to
persuade. Realizes UJ-1.

#### FR-7: Public landing page

Any visitor can view the Landing Page without authentication.

**Consequences (testable):**
- Renders fully for a signed-out visitor with no flash of a login screen.
- Contains a primary *Start free* action and a secondary *See a live demo menu*
  action leading to a sample Ordering Page.
- Readable and usable on a 360px-wide phone.

#### FR-8: Savings estimator on the landing page

A visitor can enter their monthly delivery sales and see what commission is
costing them per year.

**Consequences (testable):**
- Entering 30,000 with the default 25% shows a yearly figure of 90,000 AED.
- The result updates as the visitor types, without a page reload.
- Non-numeric input does not produce NaN on screen.

### 4.3 Menu Management

**Description:** The Owner builds the Menu. Adding the first item is the moment
the product becomes real, so it is the single call-to-action on an empty
dashboard. Everything saves as it is entered — an owner interrupted by a delivery
should lose nothing. Realizes UJ-1.

#### FR-9: Manage Menu Categories

An Owner can create, rename, reorder, and delete Menu Categories.

**Consequences (testable):**
- Deleting a Menu Category containing Menu Items asks for confirmation and names
  the count.
- Display order on the Ordering Page matches the Owner's order exactly.

#### FR-10: Manage Menu Items

An Owner can create, edit, and delete a Menu Item with name, description, price,
and optional photo within a Menu Category.

**Consequences (testable):**
- Price accepts two decimals and rejects negatives.
- An uploaded photo is resized server-side; the Ordering Page never downloads
  the original.
- Edits appear on the Ordering Page without the Owner republishing anything.

#### FR-11: Toggle availability

An Owner or Staff can mark a Menu Item unavailable and available again in one
tap.

**Consequences (testable):**
- An unavailable Menu Item renders greyed and labelled *sold out* and cannot be
  added to a Cart. Realizes UJ-2 edge case.
- An Order already containing the item is unaffected.

#### FR-12: Printable Table QRs

An Owner can generate and download a PDF of Table QRs for a chosen number of
tables.

**Consequences (testable):**
- Each code encodes the Ordering Page URL plus its Table Number.
- Scanning code number 6 opens the Ordering Page with Fulfilment Mode set to
  dine-in and Table Number 6. Realizes UJ-2.
- The PDF prints legibly at A4 with codes at least 4cm square.

### 4.4 Ordering Page

**Description:** The Diner surface. No account, no app, no download. The Diner
picks items, chooses how they will get the food, leaves a phone number, and
confirms. Speed is the whole design goal: from scan to confirmed in under a
minute. Realizes UJ-2.

#### FR-13: Browse the Menu

Any Diner can open a Restaurant's Ordering Page and browse its Menu without
authentication.

**Consequences (testable):**
- Loads with no login prompt at any point.
- Menu Categories render in the Owner's order; unavailable items are visibly
  marked.
- A Restaurant with an empty Menu shows a friendly "not taking orders yet"
  state, not an empty page.

#### FR-14: Build a Cart

A Diner can add Menu Items to a Cart, change quantities, remove items, and add a
free-text note per item.

**Consequences (testable):**
- The Cart total recalculates on every change and matches the sum of line items.
- The Cart survives a page refresh.
- A note is capped at 200 characters.

#### FR-15: Choose a Fulfilment Mode

A Diner can choose dine-in, pickup, or delivery, and the form requires only the
fields that mode needs.

**Consequences (testable):**
- dine-in requires a Table Number, prefilled when arriving from a Table QR.
- pickup requires nothing beyond the phone number.
- delivery requires a text address.
- An Owner can switch off delivery in Settings, in which case it is not offered.

#### FR-16: Place an Order

A Diner can confirm the Cart, providing a phone number, which creates an Order
with Order Status *received*.

**Consequences (testable):**
- The Order stores line items, quantities, unit prices, and total as they were at
  confirmation, so later Menu edits never rewrite history.
- The Diner is shown a status page with a link they can return to.
- Submitting twice does not create two Orders.
- The phone number is validated for shape before submission.

#### FR-17: Watch Order status

A Diner can see their Order's current Order Status without refreshing.

**Consequences (testable):**
- Status changes made by Staff appear on the Diner's page within 5 seconds.
  Realizes UJ-2.
- The link remains valid for 24 hours.

### 4.5 Order Screen (Staff)

**Description:** One screen, built for someone standing up and busy. Today's
active Orders, biggest possible touch targets, no navigation to get lost in.
Realizes UJ-3.

#### FR-18: View today's Orders

Staff and Owner can see all of today's active Orders, newest first.

**Consequences (testable):**
- Each card shows Order number, Fulfilment Mode, table or address, line items,
  notes, total, and time since it arrived.
- Completed and cancelled Orders drop off the active list.
- Usable on a tablet at arm's length: no text under 16px.

#### FR-19: New Order alert

The Order Screen surfaces a newly arrived Order without anyone refreshing.

**Consequences (testable):**
- The Order appears within 5 seconds of the Diner confirming.
- An audible sound plays, and can be muted per device.

#### FR-20: Advance Order Status

Staff can move an Order from received → cooking → ready → completed.

**Consequences (testable):**
- Status moves forward only; only an Owner can move one backward or cancel it.
- Every change records who made it and when.
- A five-second undo is offered immediately after a change. Realizes UJ-3 edge
  case.

### 4.6 Own-Driver Handoff

**Description:** We do not employ drivers and we do not build delivery logistics.
The restaurant already has a guy on a motorcycle; this feature simply stops the
kitchen from managing him on paper. Realizes UJ-4.
`[NON-GOAL for MVP: live map tracking, route optimisation, any driver
marketplace.]`

#### FR-21: Assign an Order to a Driver

An Owner or Staff can assign a delivery Order to a User with the Driver Role.

**Consequences (testable):**
- Only Orders with Fulfilment Mode *delivery* can be assigned.
- The assigned Driver's list updates within 5 seconds.
- Reassignment removes it from the previous Driver's list.

#### FR-22: Driver list and completion

A Driver can see the Orders assigned to them and mark one delivered or flagged
as a problem.

**Consequences (testable):**
- Each entry shows address, Diner phone, and total; the phone number is tappable
  to call.
- *Delivered* sets Order Status to completed. Realizes UJ-4.
- *Problem* leaves the status unchanged and raises a visible flag on the Owner
  Dashboard. Realizes UJ-4 edge case.
- A Driver sees no Order that is not theirs.

### 4.7 Owner Dashboard

**Description:** The Owner's Home surface, and the reason they renew. The first
thing on the page is not a chart — it is the money they did not lose. Realizes
UJ-5.

#### FR-23: Today at a glance

An Owner can see today's Order count, revenue, and any flagged Orders on one
screen.

**Consequences (testable):**
- Figures cover today in the Restaurant's local timezone.
- Cancelled Orders are excluded from revenue.
- Flagged Orders appear at the top with the flag reason.

#### FR-24: Savings Counter

An Owner can see how much commission the Restaurant avoided in the current
calendar month.

**Consequences (testable):**
- Value = (sum of completed Order totals this month × Commission Assumption)
  − the Subscription monthly fee. Never displayed below zero.
- Uses the Commission Assumption from Settings, defaulting to 25%.
- The formula is shown in plain language next to the number — an owner who does
  not trust it will not be persuaded by it.
- Rendered above the fold on a 360px phone. Realizes UJ-5.

#### FR-25: Customer List

An Owner can see the distinct Diner phone numbers that have ordered, with order
count and last-order date, and export them as CSV.

**Consequences (testable):**
- Diners are grouped by phone number; a repeat Diner appears once.
- Sortable by order count and by last-order date.
- The export contains only this Restaurant's Diners.

#### FR-26: Order history

An Owner can browse past Orders filtered by date range and Fulfilment Mode.

**Consequences (testable):**
- Opening an Order shows its line items and prices as recorded at the time.

### 4.8 Account, Settings, Security

**Description:** One page, three tabs, no surprises. Everything a User might
want to change about themselves, plus the Restaurant settings only an Owner
sees.

#### FR-27: Account profile

A User can view and edit their name and email, and see their Role.

**Consequences (testable):**
- Changing email requires the current password.
- Role is displayed read-only; a User cannot change their own Role.

#### FR-28: Preferences

A User can switch the interface language between Arabic and English and set
notification preferences.

**Consequences (testable):**
- Arabic renders right-to-left throughout, including the Order Screen.
- The choice persists across sessions and devices.

#### FR-29: Security

A User can change their password and see their active sessions.

**Consequences (testable):**
- Changing a password requires the current one and signs out other sessions.
- Each session shows device, approximate location, and last-used time.

#### FR-30: Restaurant settings

An Owner can edit restaurant name, opening hours, address, phone, Commission
Assumption, and whether delivery is offered.

**Consequences (testable):**
- Outside opening hours, the Ordering Page shows a "closed, opens at X" state
  and does not accept Orders.
- Turning delivery off removes it from the Diner's Fulfilment Mode choices
  immediately.

### 4.9 Support

**Description:** FAQs first, because most questions repeat; a contact form for
the rest. The form must genuinely send email — a form that silently does nothing
is worse than no form.

#### FR-31: FAQs

Any visitor can read the FAQ list without authentication.

**Consequences (testable):**
- Entries expand and collapse; at least 8 shipped at launch.
- Available in Arabic and English.

#### FR-32: Contact form

Any visitor can send a message with name, email, subject, and body.

**Consequences (testable):**
- An email arrives at the support inbox containing all four fields.
- The sender receives an automatic acknowledgement.
- The submitter sees an explicit success or failure state — never a silent one.
- If the User is authenticated, name and email are prefilled.
- Basic spam protection (honeypot plus rate limiting per IP).

#### FR-33: Support entry points

A User can reach Support from every authenticated surface.

**Consequences (testable):**
- A Support link appears in the main navigation on every authenticated page.

## 5. Non-Goals (Explicit)

- **We are not a delivery company.** No drivers of our own, no logistics, no
  live map. We route an Order to the restaurant's existing driver, and stop.
- **We are not a discovery platform.** No cross-restaurant search, no reviews,
  no ratings. A Diner arrives already knowing the restaurant.
- **We are not a POS or an accounting system.** No inventory, no shifts, no
  payroll, no tax reports.
- **We are not building a native mobile app.** The web page is the product; the
  absence of a download is a feature for the Diner.
- **We are not becoming a marketplace.** The Restaurant owns its Diners. We will
  never sell that access back to them.

## 6. MVP Scope

### 6.1 In Scope

- Signup, login, password reset, logout, Owner-managed Staff and Drivers
- Landing Page with the savings estimator
- Menu Categories and Menu Items with availability toggle and photos
- Printable Table QRs
- Ordering Page: browse, Cart, three Fulfilment Modes, place Order, watch status
- Order Screen with live arrival, sound, and status advance
- Driver list with delivered / problem
- Owner Dashboard: today's figures, Savings Counter, Customer List, history
- Account / Settings / Security with Arabic–English switching
- Support: FAQs and a working contact form

### 6.2 Out of Scope for MVP

- **Online card payment** — cash and pay-on-collection first. Payment gateway
  onboarding is slow and would delay everything else.
  `[NOTE FOR PM: the first serious investor question will be "why no payments?"
  Have the answer ready — it is a sequencing decision, not a capability gap.]`
- **Multiple branches** — one Restaurant, one location. Deferred to v2; it is
  already priced (+150 AED/branch) so it must not be forgotten.
- **Loyalty and win-back messaging** — the Customer List is the foundation; the
  campaigns on top of it are v2 and are the main reason this becomes more than
  an ordering page.
- **POS or accounting integration** — v3, and only if a chain asks.
- **Table reservations** — different job, different product.
- **Multi-language menus** — the interface is bilingual in v1; Menu Item text is
  whatever the Owner types.

## 7. Monetization

- **Base**: 300 AED per Restaurant per month, flat, regardless of Order volume.
- **Setup**: 500 AED one-time — we enter the Menu for them and print the first
  set of Table QRs. This exists to remove the real barrier, which is not price
  but the evening of data entry.
- **Extra branch**: +150 AED per month (v2).
- **Free tier**: the first 30 Orders each month are free. Chosen deliberately —
  a restaurant that crosses 30 Orders has already proved the product works, and
  is asking to pay rather than being asked.
- **Target**: 50 paying Restaurants within 6 months ≈ 15,000 AED monthly
  recurring revenue.

`[ASSUMPTION: 300 AED/month is priced from the value story, not from validated
willingness to pay. Verify with two real owners before the pitch.]`

## 8. Platform and Aesthetic

- **Platform**: responsive web only. Phone-first for the Diner and the Driver,
  tablet-first for the Order Screen, either for the Owner.
- **Languages**: Arabic and English, full RTL support.
- **Tone**: plain and direct. The audience is a busy owner, not a technology
  buyer — no growth-hacking vocabulary, no jargon in either language.
- **Visual**: calm and high-contrast. The Order Screen must be readable at
  arm's length in a bright kitchen; the Savings Counter must be the largest
  thing on the Owner Dashboard.

## 9. Success Metrics

**Primary**
- **SM-1: Time to first live Menu** — median time from signup to a Restaurant
  having ≥5 Menu Items and one printed Table QR. Target under 24 hours.
  Validates FR-1, FR-9, FR-10, FR-12.
- **SM-2: Paying Restaurants** — count with an active Subscription. Target 50 at
  month 6. Validates the whole product.
- **SM-3: Repeat Diner share** — share of a Restaurant's Orders in its third
  month coming from a phone number seen before. Target 70%. This is the number
  that proves the retention claim in §1. Validates FR-16, FR-25.

**Secondary**
- **SM-4: Diner scan-to-confirm time** — median seconds from Ordering Page open
  to Order placed. Target under 60. Validates FR-13, FR-14, FR-16.
- **SM-5: Monthly churn** — Restaurants cancelling. Target under 5%. Validates
  FR-24, since the Savings Counter is the retention mechanism.

**Counter-metrics (do not optimize)**
- **SM-C1: Orders per Restaurant** — must *not* be pushed up by us. Our fee is
  flat on purpose; chasing volume would tempt us into the percentage model we
  exist to escape. Counterbalances SM-2.
- **SM-C2: Time spent in the app by Staff** — should go *down*, not up. The
  Order Screen succeeding means nobody looks at it for long. Counterbalances any
  engagement framing of SM-4.

## 10. Open Questions

1. What commission rate do local restaurants actually pay? The Savings Counter's
   credibility rests entirely on this. Two phone calls answer it.
2. Is 300 AED/month above or below what an owner would agree to on the spot?
3. Do small restaurants want the Diner's phone number badly enough to ask for
   it, or does requiring it cost us orders?
4. Should Staff really need individual logins, or is one shared kitchen device
   login closer to how these kitchens actually work?
5. Who pays the 500 AED setup fee — is it a barrier that should be waived for
   the first ten Restaurants in exchange for a testimonial?
6. What happens when a Restaurant cancels? Do they keep their Customer List
   export? (Saying yes out loud is a strong trust signal, and costs us little.)

## 11. Assumptions Index

- §4.1 — Email/password authentication is acceptable to restaurant staff; no SMS
  OTP in v1.
- §4.1 — Staff and Drivers never self-register; the Owner adds them.
- §4.7 — 25% is a reasonable default Commission Assumption pending Q1 above.
- §7 — 300 AED/month is priced from value, not from validated willingness to pay.
- §2.2 — Cloud kitchens are correctly excluded because they have no existing
  customer base to retain.
