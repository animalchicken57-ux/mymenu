"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { signOutAction } from "@/app/actions/auth";

/**
 * The round button in the top corner, holding the three things that are not
 * the job: Settings, Help, Sign out.
 *
 * Every product puts these here, which is the whole argument for it — an owner
 * should not have to learn where this one keeps them. It also buys back the
 * navigation row, which was carrying Settings and Support alongside the four
 * links an owner actually works in.
 *
 * It lives in the shell rather than on a page because Staff and Drivers get no
 * navigation at all (EXPERIENCE.md § Information Architecture), so this is
 * their only route to any of the three — including Help, which FR-33 requires
 * to be reachable from every authenticated surface.
 */
export function AccountMenu({
  name,
  email,
  labels,
}: {
  name: string | null;
  email: string | null;
  labels: {
    account: string;
    settings: string;
    support: string;
    signOut: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={labels.account}
        className="flex size-10 items-center justify-center rounded-full bg-accent-wash text-meta font-semibold text-accent-strong"
      >
        {initials(name, email)}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute end-0 top-12 z-10 min-w-56 rounded-md border border-border-hairline bg-surface-raised py-2 shadow-lg"
        >
          {/* Which account this is. On a shared kitchen tablet that is not a
              detail — it is the difference between sending an order out under
              your name and under somebody else's. */}
          <p className="truncate px-4 pb-2 text-meta text-ink-secondary">
            {name || email}
          </p>

          <MenuLink href="/settings" onNavigate={() => setOpen(false)}>
            {labels.settings}
          </MenuLink>
          <MenuLink href="/support" onNavigate={() => setOpen(false)}>
            {labels.support}
          </MenuLink>

          <form action={signOutAction} role="none">
            <button
              type="submit"
              role="menuitem"
              className="block min-h-touch w-full px-4 text-start text-body text-ink-primary"
            >
              {labels.signOut}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex min-h-touch items-center px-4 text-body text-ink-primary"
    >
      {children}
    </Link>
  );
}

/** Two letters from a name, one from an email, and never an empty circle. */
function initials(name: string | null, email: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
  }
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();

  return (email?.trim()[0] ?? "?").toUpperCase();
}
