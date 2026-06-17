import { createClient } from '@supabase/supabase-js';

let _client;

function getClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // sin NEXT_PUBLIC_
    if (!url || !key) throw new Error('Supabase env vars not set');
    _client = createClient(url, key);
  }
  return _client;
}

export const supabase = new Proxy({}, {
  get(_, prop) { return getClient()[prop]; }
});