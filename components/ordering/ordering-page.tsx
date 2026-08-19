"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { placeOrder } from "@/app/actions/order";
import { LocationPicker } from "@/components/ordering/location-picker";
import { cartTotal, formatFils } from "@/lib/domain/money";
import { photoUrl, tileColor, tileLetter } from "@/lib/domain/photos";
import type { OpenState } from "@/lib/domain/hours";
import type { Pin } from "@/lib/domain/maps";
import type { Dictionary } from "@/lib/i18n";

/**
 * The Diner's whole world — stories 3.1 to 3.4.
 *
 * KF-2: scan, two taps, a phone number, done, in under a minute. Everything in
 * here is shaped by that: no account, no mode selector when the QR already
 * answered it, and a cart that survives the phone ringing.
 *
 * Story 7.2: the words arrive as a prop rather than through `getT()`, because
 * this is a client component and the dictionary is resolved on the server from
 * a cookie. Passing it down also means the whole page is one language for one
 * render — there is no moment where half the screen has switched.
 */

type T = Dictionary["ordering"];

type Item = {
  id: string;
  name: string;
  description: string | null;
  priceFils: number;
  isAvailable: boolean;
  photoPath: string | null;
};

type Category = { id: string; name: string; items: Item[] };

type Mode = "dine_in" | "pickup" | "delivery";

export function OrderingPage({
  restaurant,
  categories,
  tableNumber,
  openState,
  t,
}: {
  restaurant: {
    name: string;
    slug: string;
    deliveryEnabled: boolean;
    coverPath: string | null;
  };
  categories: Category[];
  tableNumber: number | null;
  openState: OpenState;
  t: T;
}) {
  const router = useRouter();
  const storageKey = `mymenu.cart.${restaurant.slug}`;

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [mode, setMode] = useState<Mode>(tableNumber ? "dine_in" : "pickup");
  const [table, setTable] = useState(tableNumber ? String(tableNumber) : "");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState<Pin | null>(null);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const itemsById = useMemo(() => {
    const map = new Map<string, Item>();
    for (const category of categories) {
      for (const item of category.items) map.set(item.id, item);
    }
    return map;
  }, [categories]);

  // The cart survives a reload, because a phone that rings mid-order must not
  // cost the restaurant the sale (EXPERIENCE.md § Component Patterns).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setQuantities(JSON.parse(saved));
    } catch {
      // A corrupt or blocked localStorage is not worth a broken menu.
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(quantities));
    } catch {}
  }, [quantities, storageKey]);

  const lines = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: itemsById.get(id), quantity: qty }))
    .filter((line): line is { item: Item; quantity: number } => !!line.item);

  const total = cartTotal(
    lines.map((l) => ({ unitPriceFils: l.item.priceFils, quantity: l.quantity })),
  );
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  function setQuantity(id: string, next: number) {
    setQuantities((current) => ({ ...current, [id]: Math.max(0, next) }));
  }

  function confirm() {
    setError(null);

    startTransition(async () => {
      const result = await placeOrder({
        slug: restaurant.slug,
        mode,
        phone,
        items: lines.map((l) => ({
          menu_item_id: l.item.id,
          quantity: l.quantity,
        })),
        table: mode === "dine_in" ? Number(table) || null : null,
        address: mode === "delivery" ? address : null,
        note: note.trim() || null,
        lat: mode === "delivery" ? (pin?.lat ?? null) : null,
        lng: mode === "delivery" ? (pin?.lng ?? null) : null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      try {
        window.localStorage.removeItem(storageKey);
      } catch {}

      router.push(`/o/${result.orderRef}`);
    });
  }

  // ---------------------------------------------------------------------------

  if (!openState.open) {
    return (
      <Shell restaurant={restaurant} t={t}>
        <div className="rounded-md border border-border-hairline bg-surface-raised p-8 text-center">
          <p className="text-heading text-ink-primary">{t.closedTitle}</p>
          {openState.opensAt ? (
            <p className="mt-2 text-body text-ink-secondary">
              {t.opensAt(openState.opensAt)}
            </p>
          ) : null}
        </div>
      </Shell>
    );
  }

  if (categories.length === 0) {
    return (
      <Shell restaurant={restaurant} t={t}>
        <div className="rounded-md border border-border-hairline bg-surface-raised p-8 text-center">
          <p className="text-heading text-ink-primary">{t.notTakingOrders}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      restaurant={restaurant}
      tableNumber={tableNumber}
      categories={categories}
      t={t}
    >
      <div className="flex flex-col gap-10 pb-36">
        {categories.map((category) => (
          <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-20">
            <h2 className="text-heading text-ink-primary">{category.name}</h2>

            <ul className="mt-3 flex flex-col gap-3">
              {category.items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-stretch gap-4 overflow-hidden rounded-md border border-border-hairline bg-surface-raised ${
                    item.isAvailable ? "" : "opacity-60"
                  }`}
                >
                  <DishTile item={item} />

                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-4">
                    <p
                      className={`text-body font-semibold ${
                        item.isAvailable
                          ? "text-ink-primary"
                          : "text-ink-disabled"
                      }`}
                    >
                      {item.name}
                    </p>
                    {item.description ? (
                      <p className="text-meta text-ink-secondary">
                        {item.description}
                      </p>
                    ) : null}
                    <p className="tabular text-body font-bold text-accent-strong">
                      {formatFils(item.priceFils)}
                      <span className="ms-1 text-meta font-medium text-ink-secondary">
                        {t.currency}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center pe-4">
                    {item.isAvailable ? (
                      <Stepper
                        quantity={quantities[item.id] ?? 0}
                        onChange={(next) => setQuantity(item.id, next)}
                        label={item.name}
                        t={t}
                      />
                    ) : (
                      // Greyed in place, never hidden — a diner who cannot find
                      // the dish they came for asks a human instead.
                      <span className="shrink-0 rounded-full bg-surface-sunken px-3 py-1 text-meta text-ink-secondary">
                        {t.soldOut}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {count > 0 && !checkingOut ? (
        <CartBar
          count={count}
          total={total}
          onCheckout={() => setCheckingOut(true)}
          t={t}
        />
      ) : null}

      {checkingOut ? (
        <Checkout
          t={t}
          restaurant={restaurant}
          lines={lines}
          total={total}
          mode={mode}
          setMode={setMode}
          table={table}
          setTable={setTable}
          address={address}
          setAddress={setAddress}
          pin={pin}
          setPin={setPin}
          phone={phone}
          setPhone={setPhone}
          note={note}
          setNote={setNote}
          tableLocked={tableNumber !== null}
          error={error}
          pending={pending}
          onBack={() => setCheckingOut(false)}
          onConfirm={confirm}
        />
      ) : null}
    </Shell>
  );
}

// -----------------------------------------------------------------------------

/**
 * The picture of the dish, or a stand-in for it.
 *
 * A menu with no photographs still has to look like a menu. Every dish without
 * one gets a coloured tile carrying its first letter, in a colour derived from
 * its name, so the page has life on the day an owner finishes typing and before
 * they have photographed anything. Not an emoji, and not a grey placeholder
 * box — both of those read as unfinished.
 */
function DishTile({ item }: { item: Item }) {
  const url = photoUrl(item.photoPath);

  if (url) {
    return (
      <Image
        src={url}
        alt={item.name}
        width={192}
        height={192}
        className="size-24 shrink-0 object-cover"
        unoptimized
      />
    );
  }

  const color = tileColor(item.name || item.id);

  return (
    <div
      aria-hidden="true"
      className="flex size-24 shrink-0 items-center justify-center"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} var(--tile-mix), transparent)`,
        color: `color-mix(in srgb, ${color} var(--tile-ink-mix), white)`,
      }}
    >
      <span className="text-title font-bold">{tileLetter(item.name)}</span>
    </div>
  );
}

function Shell({
  restaurant,
  tableNumber,
  categories,
  children,
  t,
}: {
  restaurant: { name: string; coverPath?: string | null };
  tableNumber?: number | null;
  categories?: Category[];
  children: React.ReactNode;
  t: T;
}) {
  const cover = photoUrl(restaurant.coverPath);

  return (
    // diner-dark redefines the palette tokens for everything inside, so the
    // Diner reads a dark page while the Owner and the kitchen stay light
    // (globals.css § The Diner's dark room).
    <main className="diner-dark flex min-h-screen flex-1 flex-col">
      <header className="relative bg-surface-sunken">
        {cover ? (
          <>
            <Image
              src={cover}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
            {/* The scrim is the whole reason a photo can go here at all. A
                restaurant's own picture is busy by nature — plates, faces,
                strip lights — and the name has to stay readable on top of
                whatever they upload. Darkest at the bottom, where the section
                buttons sit. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/65 to-black/85"
            />
          </>
        ) : null}

        <div className="relative mx-auto w-full max-w-xl px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-title text-ink-primary">{restaurant.name}</h1>
              {tableNumber ? (
                <p className="mt-2 inline-flex rounded-full bg-accent-wash px-3 py-1 text-meta font-semibold text-accent-strong">
                  {t.tableLabel(tableNumber)}
                </p>
              ) : null}
            </div>

            {/* Whose software this is. It sits opposite the restaurant's own
                name rather than above it — the restaurant is the brand on this
                page, and we are the small print. Flips side in Arabic. */}
            <span className="shrink-0 pt-1 text-meta uppercase tracking-widest text-ink-secondary">
              MyMenu
            </span>
          </div>
        </div>

        {/* Jump links, not decoration: a menu with eight sections is a long
            scroll on a phone held in one hand over a table. */}
        {categories && categories.length > 1 ? (
          <nav
            aria-label={t.menuSections}
            className="relative mx-auto w-full max-w-xl overflow-x-auto px-4 pb-4"
          >
            <ul className="flex gap-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <a
                    href={`#cat-${category.id}`}
                    className="block whitespace-nowrap rounded-full border border-border-hairline bg-surface-raised/90 px-4 py-2 text-meta text-ink-primary backdrop-blur-sm"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      <div className="mx-auto w-full max-w-xl px-4 py-8">{children}</div>
    </main>
  );
}

function Stepper({
  quantity,
  onChange,
  label,
  t,
}: {
  quantity: number;
  onChange: (next: number) => void;
  label: string;
  t: T;
}) {
  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(1)}
        aria-label={t.addNamed(label)}
        className="min-h-touch shrink-0 rounded-md bg-accent px-5 text-body font-semibold text-white"
      >
        {t.add}
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={t.oneFewer(label)}
        className="min-h-touch w-12 rounded-md border border-border-strong text-body"
      >
        −
      </button>
      <span className="tabular w-8 text-center text-body font-semibold">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label={t.oneMore(label)}
        className="min-h-touch w-12 rounded-md border border-border-strong text-body"
      >
        +
      </button>
    </div>
  );
}

function CartBar({
  count,
  total,
  onCheckout,
  t,
}: {
  count: number;
  total: number;
  onCheckout: () => void;
  t: T;
}) {
  return (
    // The one shadow in the whole design system (DESIGN.md § Elevation).
    <div className="fixed inset-x-0 bottom-0 border-t border-border-hairline bg-surface-raised shadow-[0_-8px_24px_rgba(22,24,29,0.08)]">
      <div className="mx-auto flex w-full max-w-xl items-center gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-meta text-ink-secondary">{t.itemCount(count)}</p>
          <p className="tabular text-body font-semibold text-ink-primary">
            {formatFils(total)} {t.currency}
          </p>
        </div>
        <button
          type="button"
          onClick={onCheckout}
          className="min-h-touch rounded-md bg-accent px-6 text-body font-semibold text-white"
        >
          {t.orderButton}
        </button>
      </div>
    </div>
  );
}

function Checkout(props: {
  t: T;
  restaurant: { deliveryEnabled: boolean };
  lines: { item: Item; quantity: number }[];
  total: number;
  mode: Mode;
  setMode: (m: Mode) => void;
  table: string;
  setTable: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  pin: Pin | null;
  setPin: (p: Pin | null) => void;
  phone: string;
  setPhone: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  tableLocked: boolean;
  error: string | null;
  pending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const t = props.t;

  const modes: { value: Mode; label: string }[] = [
    { value: "dine_in", label: t.modeDineIn },
    { value: "pickup", label: t.modePickup },
    ...(props.restaurant.deliveryEnabled
      ? [{ value: "delivery" as Mode, label: t.modeDelivery }]
      : []),
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto bg-surface-base">
      <div className="mx-auto w-full max-w-xl px-4 py-8">
        <button
          type="button"
          onClick={props.onBack}
          className="min-h-touch text-meta text-ink-secondary"
        >
          {t.backToMenu}
        </button>

        <h2 className="mt-4 text-title text-ink-primary">{t.yourOrder}</h2>

        <ul className="mt-4 flex flex-col gap-2">
          {props.lines.map(({ item, quantity }) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4">
              <span className="text-body text-ink-primary">
                <span className="tabular font-semibold">{quantity}×</span>{" "}
                {item.name}
              </span>
              <span className="tabular text-body text-ink-primary">
                {formatFils(item.priceFils * quantity)}
              </span>
            </li>
          ))}
        </ul>

        <p className="tabular mt-4 border-t border-border-hairline pt-4 text-heading font-semibold text-ink-primary">
          {formatFils(props.total)} {t.currency}
        </p>

        {/* FR-15: only ask for what this mode actually needs. When a table QR
            answered the question, do not ask it again. */}
        {props.tableLocked ? null : (
          <fieldset className="mt-8">
            <legend className="text-meta font-medium text-ink-primary">
              {t.howAreYouGettingIt}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {modes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => props.setMode(m.value)}
                  aria-pressed={props.mode === m.value}
                  className={`min-h-touch rounded-md border px-4 text-body ${
                    props.mode === m.value
                      ? "border-accent bg-accent-wash text-accent-strong"
                      : "border-border-strong bg-surface-raised text-ink-primary"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-6 flex flex-col gap-5">
          {props.mode === "dine_in" && !props.tableLocked ? (
            <Labelled label={t.tableNumber}>
              <input
                inputMode="numeric"
                value={props.table}
                onChange={(e) => props.setTable(e.target.value)}
                className="min-h-touch w-full rounded-sm border border-border-strong bg-surface-raised px-4 text-body"
              />
            </Labelled>
          ) : null}

          {props.mode === "delivery" ? (
            <>
              <LocationPicker pin={props.pin} onPin={props.setPin} t={t} />

              <Labelled label={t.whereToBring}>
                <textarea
                  rows={2}
                  value={props.address}
                  onChange={(e) => props.setAddress(e.target.value)}
                  placeholder={t.addressHint}
                  className="w-full rounded-sm border border-border-strong bg-surface-raised px-4 py-3 text-body"
                />
              </Labelled>
            </>
          ) : null}

          <Labelled label={t.yourPhone}>
            <input
              inputMode="tel"
              autoComplete="tel"
              value={props.phone}
              onChange={(e) => props.setPhone(e.target.value)}
              placeholder={t.phoneHint}
              className="min-h-touch w-full rounded-sm border border-border-strong bg-surface-raised px-4 text-body"
            />
          </Labelled>

          <Labelled label={t.kitchenNote}>
            <textarea
              rows={2}
              maxLength={200}
              value={props.note}
              onChange={(e) => props.setNote(e.target.value)}
              placeholder={t.kitchenNoteHint}
              className="w-full rounded-sm border border-border-strong bg-surface-raised px-4 py-3 text-body"
            />
          </Labelled>
        </div>

        {props.error ? (
          <p role="alert" className="mt-6 text-body text-status-problem">
            {props.error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={props.onConfirm}
          disabled={props.pending}
          className="mt-8 min-h-touch w-full rounded-md bg-accent px-6 text-body font-semibold text-white disabled:opacity-60"
        >
          {props.pending ? t.sending : t.sendToKitchen}
        </button>

        <p className="mt-4 pb-8 text-center text-meta text-ink-secondary">
          {t.payAtRestaurant}
        </p>
      </div>
    </div>
  );
}

function Labelled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-meta font-medium text-ink-primary">{label}</span>
      {children}
    </label>
  );
}
