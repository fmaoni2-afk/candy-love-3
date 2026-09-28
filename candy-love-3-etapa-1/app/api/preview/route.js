import { serviceClient, bucket } from '../../../lib/supabase';
export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!/^[0-9a-f-]{36}$/i.test(id || '')) return new Response('Inválido', { status: 400 });
  const db = serviceClient();
  const { data: product } = await db.from('products').select('preview_path').eq('id', id).eq('active', true).maybeSingle();
  if (!product?.preview_path) return new Response('Não encontrado', { status: 404 });
  const { data, error } = await db.storage.from(bucket).download(product.preview_path);
  if (error) return new Response('Prévia indisponível', { status: 404 });
  return new Response(data, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=300' } });
}
