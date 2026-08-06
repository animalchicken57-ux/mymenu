"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { getMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * The contact form — story 8.4.
 *
 * EXPERIENCE.md is blunt about this one: a form that silently does nothing is
 * worse than no form. So the message is written to the database first, and the
 * email is attempted second. If the email provider is down or unconfigured, the
 * message still exists and the sender is still told the truth.
 */

export type SupportResult = {
  ok: boolean;
  error?: string;
  message?: "sent";
};

const schema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(80),
  email: z.string().trim().email("That does not look like an email address."),
  subject: z.string().trim().min(1, "What is it about?").max(120),
  body: z.string().trim().min(1, "Write your message.").max(4000),
  // Honeypot. A human never sees this field, so anything in it is a bot.
  website: z.string().max(0).optional(),
});

/**
 * Per-IP rate limit. In-memory, so it is per serverless instance rather than
 * global — it stops the obvious flood without pretending to be a real limiter.
 * A shared store is worth adding when there is traffic to justify it.
 */
const recent = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);

  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return true;
  }

  hits.push(now);
  recent.set(ip, hits);
  return false;
}

async function sendEmail(fields: z.infer<typeof schema>): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const inbox = process.env.SUPPORT_INBOX;
  if (!key || !inbox) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MyMenu <onboarding@resend.dev>",
      to: [inbox],
      reply_to: fields.email,
      subject: `MyMenu support — ${fields.subject}`,
      text: `From: ${fields.name} <${fields.email}>\n\n${fields.body}`,
    }),
  });
}

export async function sendSupportMessage(
  _prev: SupportResult | null,
  formData: FormData,
): Promise<SupportResult> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  // A filled honeypot gets the success screen. Telling a bot it was caught only
  // teaches whoever wrote it to try again differently.
  if (parsed.data.website) return { ok: true, message: "sent" };

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (rateLimited(ip)) {
    return {
      ok: false,
      error: "That is a lot of messages at once. Give it a minute.",
    };
  }

  const me = await getMe();
  const supabase = await createClient();

  const { error } = await supabase.from("support_messages").insert({
    restaurant_id: me?.restaurant_id ?? null,
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    body: parsed.data.body,
  });

  if (error) {
    return {
      ok: false,
      error: "We could not send that. Try again, or email us directly.",
    };
  }

  try {
    await sendEmail(parsed.data);
  } catch {
    // The message is already saved. Failing the whole submission because the
    // email hop failed would throw away a message we already have.
  }

  return { ok: true, message: "sent" };
}
