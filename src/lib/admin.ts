import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "./auth";

/**
 * Admins are the user accounts whose email is listed in ADMIN_EMAILS (comma-separated).
 * Keeping this in env means granting/revoking admin needs no schema change and can't be
 * done from the site itself.
 */
export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  return !!email && adminEmails().includes(email.toLowerCase());
}

/**
 * Call at the top of every admin page AND every admin server action — rendering-time
 * checks alone are not a security boundary (actions are public POST endpoints).
 * Not logged in → login page; logged in but not admin → 404 (don't reveal the panel).
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/?next=/admin/");
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
