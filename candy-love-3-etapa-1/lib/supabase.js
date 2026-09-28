import { createClient } from '@supabase/supabase-js';

export const bucket = process.env.SUPABASE_BUCKET || 'andy-love-private';
export function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export function serviceClient() {
  if (!process.env.SUPABASE_SECRET_KEY) throw new Error('SUPABASE_SECRET_KEY não configurada');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function authenticatedUser(request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  const { data, error } = await publicClient().auth.getUser(token);
  return error ? null : data.user;
}
export async function adminUser(request) {
  const user = await authenticatedUser(request);
  return user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase() && user.email_confirmed_at ? user : null;
}
