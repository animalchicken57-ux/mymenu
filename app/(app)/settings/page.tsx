import { redirect } from "next/navigation";

/**
 * /settings itself holds nothing now that each section has its own page. Send
 * anyone who lands here — an old link, the account menu — to the first section
 * rather than showing them an empty frame.
 */
export default function SettingsPage() {
  redirect("/settings/profile");
}
