import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../lib/supabase';

const FREE_LIMIT = 5;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ allowed: false, reason: 'not_authenticated' });

  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const count = data?.count || 0;
  return Response.json({ allowed: count < FREE_LIMIT, count, limit: FREE_LIMIT });
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'not_authenticated' }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing) {
    await supabase
      .from('usage_tracking')
      .update({ count: existing.count + 1 })
      .eq('user_id', userId)
      .eq('date', today);
    return Response.json({ count: existing.count + 1, limit: FREE_LIMIT });
  } else {
    await supabase
      .from('usage_tracking')
      .insert({ user_id: userId, date: today, count: 1 });
    return Response.json({ count: 1, limit: FREE_LIMIT });
  }
}