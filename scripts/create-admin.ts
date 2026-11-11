/**
 * Creates (or resets the password of) an admin account.
 *
 *   npm run admin:create -- <email> <password>
 *
 * The email must also be listed in ADMIN_EMAILS for /admin/ access (this script warns if it isn't).
 * Self-registration is disabled on the site, so this is how admin accounts are made.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { prismaDatabaseUrl } from "../src/lib/db-url";

export async function upsertAdmin(prisma: PrismaClient, rawEmail: string, password: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`Invalid email: ${rawEmail}`);
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, firstName: "Admin", hashedPassword },
    update: { hashedPassword },
  });
  // sign out any existing sessions after a password reset
  await prisma.session.deleteMany({ where: { userId: user.id } });
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!admins.includes(email)) console.warn(`⚠ ${email} is not in ADMIN_EMAILS — add it to .env to allow /admin/ access.`);
  return user;
}

if (require.main === module) {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npm run admin:create -- <email> <password>");
    process.exit(1);
  }
  const prisma = new PrismaClient({ datasourceUrl: prismaDatabaseUrl() });
  upsertAdmin(prisma, email, password)
    .then((u) => console.log(`Admin account ready: ${u.email}`))
    .catch((e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
