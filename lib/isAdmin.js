import { currentUser } from '@clerk/nextjs/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export async function checkIsAdmin() {
  if (ADMIN_EMAILS.length === 0) return false;
  const user = await currentUser();
  if (!user) return false;
  const emails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());
  return emails.some(e => ADMIN_EMAILS.includes(e));
}
