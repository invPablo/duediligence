import { supabase } from '../../../../lib/supabase';
import { checkIsAdmin } from '../../../../lib/isAdmin';

export async function GET() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) return Response.json({ error: 'Not authorized' }, { status: 403 });

  const { data, error } = await supabase.from('blog_posts').select('*').order('date', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ posts: data || [] });
}
