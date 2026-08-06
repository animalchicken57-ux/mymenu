"use client";

import { useActionState } from "react";

import { sendSupportMessage, type SupportResult } from "@/app/actions/support";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ContactForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [state, action] = useActionState<SupportResult | null, FormData>(
    sendSupportMessage,
    null,
  );

  // EXPERIENCE.md: on success the form is replaced entirely by a confirmation
  // that says what happens next — not a green tick above a form still holding
  // the message, which leaves people wondering whether to press send again.
  if (state?.message === "sent") {
    return (
      <div className="rounded-md bg-accent-wash p-6">
        <p className="text-body font-semibold text-accent-strong">
          Message sent.
        </p>
        <p className="mt-2 text-body text-accent-strong">
          We read everything that comes in and reply to the email address you
          gave us, usually within a day.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field name="name" label="Your name" defaultValue={defaultName} />
      <Field
        name="email"
        label="Your email"
        type="email"
        autoComplete="email"
        defaultValue={defaultEmail}
      />
      <Field name="subject" label="What is it about?" />

      <label className="flex flex-col gap-2">
        <span className="text-meta font-medium text-ink-primary">
          Your message
        </span>
        <textarea
          name="body"
          rows={6}
          required
          maxLength={4000}
          className="rounded-sm border border-border-strong bg-surface-raised px-4 py-3 text-body"
        />
      </label>

      {/* Honeypot: off-screen and hidden from screen readers, so only something
          filling every field it finds will touch it. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state && !state.ok ? (
        <p role="alert" className="text-meta text-status-problem">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Sending">Send</SubmitButton>
    </form>
  );
}
