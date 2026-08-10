import { requireRole } from "@/lib/auth";
import { FILS_PER_DIRHAM } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

/**
 * The Customer List as a spreadsheet — story 6.3.
 *
 * FR-25 and the FAQ both promise an owner can walk away with this list,
 * "including on the day you decide to leave us". A product that says that has to
 * mean it, so there is no row cap here and no upsell in the way.
 *
 * Row Level Security scopes the view, so there is deliberately no restaurant_id
 * filter in the query — see the same note on the kitchen page.
 */

/**
 * A field that begins =, +, -, @, tab or carriage return is executed as a
 * formula by Excel, Numbers and Sheets. `diner_phone` is free text a stranger
 * typed into a public ordering page, so this file is untrusted input being
 * handed to a spreadsheet — the one place CSV injection actually bites. Prefixed
 * with an apostrophe, which spreadsheets treat as "this is text".
 */
function csvCell(value: string): string {
  const neutralised = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${neutralised.replace(/"/g, '""')}"`;
}

/** 4550 → "45.50". No grouping comma, because this is going into a column. */
function plainDirhams(fils: number): string {
  const abs = Math.abs(Math.round(fils));
  const whole = Math.floor(abs / FILS_PER_DIRHAM);
  const part = abs % FILS_PER_DIRHAM;
  return `${fils < 0 ? "-" : ""}${whole}.${String(part).padStart(2, "0")}`;
}

export async function GET() {
  const me = await requireRole("owner");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("diner_phone, order_count, last_order_at, lifetime_fils")
    .order("last_order_at", { ascending: false });

  if (error) {
    return new Response("That export failed. Try again.", { status: 500 });
  }

  const rows = [
    ["Phone", "Orders", "Total spent (AED)", "Last order"].map(csvCell).join(","),
    ...(data ?? []).map((customer) =>
      [
        csvCell(customer.diner_phone ?? ""),
        csvCell(String(customer.order_count ?? 0)),
        csvCell(plainDirhams(customer.lifetime_fils ?? 0)),
        csvCell(
          customer.last_order_at
            ? new Date(customer.last_order_at).toISOString().slice(0, 10)
            : "",
        ),
      ].join(","),
    ),
  ];

  // CRLF because that is what the CSV spec says and what Excel on Windows
  // expects; the BOM because without it Excel reads the file as the local
  // codepage and mangles anything outside ASCII.
  const csv = `﻿${rows.join("\r\n")}\r\n`;

  const today = new Date().toISOString().slice(0, 10);
  const filename = `customers-${me.restaurant.slug}-${today}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // An owner's customer list has no business in a shared cache.
      "Cache-Control": "no-store",
    },
  });
}
