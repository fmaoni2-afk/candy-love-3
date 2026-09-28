import { createClient } from '@supabase/supabase-js';
let client;
export function browserClient() {
  if (!client) client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return client;
}
export async function authorizedFetch(path, body) {
  const { data: { session } } = await browserClient().auth.getSession();
  if (!session) throw new Error('Entre na sua conta primeiro.');
  const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Erro ao salvar.');
  return data;
}
