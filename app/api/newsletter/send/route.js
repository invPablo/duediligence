import { supabase } from '../../../../lib/supabase';
import { checkIsAdmin } from '../../../../lib/isAdmin';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (!resend) {
    return Response.json({ error: 'Resend API key not configured' }, { status: 500 });
  }

  const { subject, html } = await req.json();

  if (!subject || !html) {
    return Response.json({ error: 'Subject and HTML are required' }, { status: 400 });
  }

  // Get all subscribers
  const { data: subscribers, error: fetchError } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .limit(10000);

  if (fetchError) {
    return Response.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return Response.json({ error: 'No subscribers found' }, { status: 400 });
  }

  // Send emails in batches (Resend allows 100 emails per request)
  const batchSize = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    const emails = batch.map(sub => ({
      from: 'onboarding@resend.dev',
      to: sub.email,
      subject,
      html,
    }));

    try {
      const { data, error } = await resend.batch.send(emails);
      if (error) {
        failed += batch.length;
      } else {
        sent += batch.length;
      }
    } catch (error) {
      console.error('Batch send error:', error);
      failed += batch.length;
    }
  }

  return Response.json({
    success: true,
    sent,
    failed,
    total: subscribers.length,
  });
}
