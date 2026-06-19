import { checkIsAdmin } from '../../../../lib/isAdmin';

export async function GET() {
  const isAdmin = await checkIsAdmin();
  return Response.json({ isAdmin });
}
