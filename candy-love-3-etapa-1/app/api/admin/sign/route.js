import { adminUser, serviceClient, bucket } from '../../../../lib/supabase';
export async function POST(request) {
  const user = await adminUser(request);
  if (!user) return Response.json({ error: 'Apenas a conta administradora confirmada pode enviar arquivos.' }, { status: 403 });
  const { name, type, size, kind } = await request.json();
  const image = /^image\/(jpeg|png|webp)$/i.test(type || '');
  const video = /^video\/(mp4|webm|quicktime)$/i.test(type || '');
  if (!name || !Number.isInteger(size) || size < 1 || size > 50 * 1024 * 1024 || (kind === 'preview' ? !image : !image && !video))
    return Response.json({ error: 'Arquivo inválido ou maior que 50 MB.' }, { status: 400 });
  const extension = kind === 'preview' ? 'jpg' : ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov'}[type]);
  const path = `${kind === 'preview' ? 'previews' : 'originals'}/${user.id}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await serviceClient().storage.from(bucket).createSignedUploadUrl(path);
  if (error) return Response.json({ error: `Não foi possível preparar o upload: ${error.message}` }, { status: 502 });
  return Response.json({ path, token: data.token });
}
