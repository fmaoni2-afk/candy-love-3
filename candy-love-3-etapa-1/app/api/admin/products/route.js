import { adminUser, serviceClient, bucket } from '../../../../lib/supabase';
export async function POST(request) {
  const user = await adminUser(request);
  if (!user) return Response.json({ error: 'Acesso de administrador necessário.' }, { status: 403 });
  const { title, description, price_cents, media, preview_path } = await request.json();
  const images = media?.filter(x=>x.type?.startsWith('image/')).length || 0;
  const videos = media?.filter(x=>x.type?.startsWith('video/')).length || 0;
  if (typeof title !== 'string' || !title.trim() || title.length > 160 || !Number.isSafeInteger(price_cents) || price_cents < 0 || !Array.isArray(media) || !media.length || media.length !== images + videos || images > 5 || videos > 3 || !media.every(x=>typeof x.path === 'string' && x.path.startsWith(`originals/${user.id}/`)) || typeof preview_path !== 'string' || !preview_path.startsWith(`previews/${user.id}/`))
    return Response.json({ error: 'Confira o título, preço e arquivos.' }, { status: 400 });
  const db = serviceClient();
  const paths = [...media.map(x=>x.path), preview_path];
  for (const path of paths) {
    const slash = path.lastIndexOf('/');
    const { data, error } = await db.storage.from(bucket).list(path.slice(0, slash), { search: path.slice(slash+1) });
    if (error || !data?.some(x=>x.name === path.slice(slash+1))) return Response.json({ error: 'Um dos arquivos não foi enviado por completo.' }, { status: 400 });
  }
  const { error } = await db.from('products').insert({ title: title.trim(), description: String(description || '').slice(0, 2000), price_cents, media, preview_path, active: true });
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true });
}
