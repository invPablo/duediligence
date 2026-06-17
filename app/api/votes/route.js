import { supabase } from '../../../lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = searchParams.get('ticker')?.toUpperCase();

    const { userId } = await auth();

    // If no ticker, return vote count for the authenticated user
    if (!ticker) {
      if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });

      const { data: userVotes, error } = await supabase
        .from('votes')
        .select('ticker')
        .eq('user_id', userId);

      if (error) throw error;

      return Response.json({ count: userVotes?.length || 0 });
    }

    // Return vote percentages for a ticker
    const { data: votes, error } = await supabase
      .from('votes')
      .select('vote')
      .eq('ticker', ticker);

    if (error) throw error;

    const counts = { BUY: 0, HOLD: 0, SELL: 0 };
    votes.forEach(v => counts[v.vote]++);
    const total = votes.length || 1;
    const percentages = {
      BUY: Math.round((counts.BUY / total) * 100),
      HOLD: Math.round((counts.HOLD / total) * 100),
      SELL: Math.round((counts.SELL / total) * 100),
    };

    let userVote = null;
    if (userId) {
      const { data: userVotes } = await supabase
        .from('votes')
        .select('vote')
        .eq('ticker', ticker)
        .eq('user_id', userId)
        .single();
      if (userVotes) userVote = userVotes.vote;
    }

    return Response.json({ percentages, userVote, total });
  } catch (error) {
    console.error('votes GET error:', error);
    return Response.json({ error: 'Error fetching votes' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }

    const { ticker, vote } = await req.json();
    if (!ticker || !['BUY', 'HOLD', 'SELL'].includes(vote)) {
      return Response.json({ error: 'Invalid ticker or vote' }, { status: 400 });
    }

    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('ticker', ticker)
      .eq('user_id', userId)
      .single();

    const isNewVote = !existingVote;

    const { error } = await supabase
      .from('votes')
      .upsert([{ ticker: ticker.toUpperCase(), user_id: userId, vote }], {
        onConflict: 'ticker,user_id',
      });

    if (error) throw error;

    const { data: allUserVotes } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId);

    const voteCount = allUserVotes?.length || 0;

    return Response.json({ success: true, voteCount, isNewVote });
  } catch (error) {
    console.error('votes POST error:', error);
    return Response.json({ error: 'Error saving vote' }, { status: 500 });
  }
}
