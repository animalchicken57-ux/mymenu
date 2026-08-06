import Link from "next/link";

import { ContactForm } from "@/components/support/contact-form";
import { getMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Support — stories 8.3 and 8.4. FAQs first, because most questions repeat. */

const FAQS = [
  {
    q: "Do my customers need to download anything?",
    a: "No. They scan the code on the table, or open your link, and the menu is just there. No app, no account, no password.",
  },
  {
    q: "Do you deliver the food?",
    a: "No, and we do not plan to. MyMenu takes the order. The food reaches the customer one of three ways: they are sitting at a table, they collect it, or your own driver takes it. If someone wants a stranger to drive it across town, that is what the delivery apps are for.",
  },
  {
    q: "So should I stop using Talabat and Deliveroo?",
    a: "Probably not. They are good at bringing you people who have never heard of you. MyMenu is for keeping the people who already came. Most restaurants are better off running both.",
  },
  {
    q: "What does it cost?",
    a: "300 AED a month, flat, no matter how many orders you take. Your first 30 orders each month are free so you can try it properly. If you want us to type your menu in for you, that is 500 AED once.",
  },
  {
    q: "Why a flat fee and not a percentage?",
    a: "Because a percentage is the thing you are trying to escape. If we took a cut, we would start wanting your bills to be bigger, and we would end up exactly where the delivery apps are.",
  },
  {
    q: "Can my kitchen staff use it without seeing my money?",
    a: "Yes. A kitchen account sees one screen: today's orders. It cannot open your dashboard, your revenue, or your customer list — the database refuses, not just the buttons.",
  },
  {
    q: "Can customers pay online?",
    a: "Not yet. Right now they pay you at the restaurant or on collection. Card payment is the next thing we add.",
  },
  {
    q: "Who owns my customer list?",
    a: "You do. Every phone number that orders from you is yours, and you can export the whole list to a spreadsheet whenever you like — including on the day you decide to leave us.",
  },
  {
    q: "What happens if my internet goes down?",
    a: "The kitchen screen tells you, loudly and constantly, and it beeps every minute until it comes back. The one thing we will never do is stay quiet and let you think it is a slow night.",
  },
  {
    q: "Is it in Arabic?",
    a: "Yes, the whole thing, and it flips to right-to-left properly. You can switch language in Settings.",
  },
];

export default async function SupportPage() {
  const me = await getMe();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <Link
        href="/"
        className="text-meta uppercase tracking-widest text-ink-secondary"
      >
        MyMenu
      </Link>

      <h1 className="mt-4 text-title text-ink-primary">Support</h1>
      <p className="mt-2 max-w-prose text-body text-ink-secondary">
        The questions we get most, and a way to ask anything else.
      </p>

      <section className="mt-10">
        <h2 className="text-heading text-ink-primary">Common questions</h2>

        <div className="mt-4 flex flex-col gap-2">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="rounded-md border border-border-hairline bg-surface-raised p-4"
            >
              <summary className="cursor-pointer text-body font-semibold text-ink-primary">
                {faq.q}
              </summary>
              <p className="mt-3 max-w-prose text-body text-ink-secondary">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-border-hairline pt-8">
        <h2 className="text-heading text-ink-primary">Ask us something</h2>
        <p className="mt-2 max-w-prose text-body text-ink-secondary">
          A real person reads these.
        </p>

        <div className="mt-6">
          <ContactForm
            defaultName={me?.full_name ?? ""}
            defaultEmail={user?.email ?? ""}
          />
        </div>
      </section>
    </main>
  );
}
