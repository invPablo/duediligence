import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toUpperCase().trim();

  if (!q || q.length < 1) return Response.json({ results: [] });

  try {
    const { data } = await supabase
      .from('stock_cache')
      .select('ticker, data')
      .or(`ticker.ilike.${q}%,data->>name.ilike.%${q}%`)
      .limit(8);

    const results = (data || []).map(r => ({
      ticker: r.ticker,
      name: r.data?.name,
      sector: r.data?.sector,
      exchange: r.data?.exchange,
    }));

    return Response.json({ results });
  } catch (e) {
    console.error(e);
    return Response.json({ results: [] });
  }
}