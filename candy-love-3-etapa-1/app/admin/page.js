'use client';
import { useEffect, useState } from 'react';
import * as tus from 'tus-js-client';
import { browserClient, authorizedFetch } from '../../lib/browser';

async function makePreview(file) {
  const url = URL.createObjectURL(file);
  try {
    const source = await new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Não foi possível ler a foto.')); img.src = url;
      } else {
        const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.preload = 'auto';
        video.onloadeddata = () => { video.currentTime = Math.min(.2, (video.duration || .2) / 2); };
        video.onseeked = () => resolve(video); video.onerror = () => reject(new Error('Não foi possível criar a prévia do vídeo.')); video.src = url;
      }
    });
    const width = source.videoWidth || source.naturalWidth, height = source.videoHeight || source.naturalHeight;
    const scale = Math.min(1, 640 / Math.max(width, height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d'); ctx.filter = 'blur(16px)'; ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Falha ao gerar prévia.')), 'image/jpeg', .6));
  } finally { URL.revokeObjectURL(url); }
}

async function upload(file, kind, onProgress) {
  const type = kind === 'preview' ? 'image/jpeg' : file.type;
  const signed = await authorizedFetch('/api/admin/sign', { name: file.name || 'preview.jpg', type, size: file.size, kind });
  if (kind === 'preview' || file.size <= 6 * 1024 * 1024) {
    const { error } = await browserClient().storage.from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET).uploadToSignedUrl(signed.path, signed.token, file, { contentType: type });
    if (error) throw error;
  } else {
    await new Promise((resolve, reject) => {
      const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
      const transfer = new tus.Upload(file, {
        endpoint: `https://${project}.storage.supabase.co/storage/v1/upload/resumable`,
        headers: { 'x-signature': signed.token },
        metadata: { bucketName: process.env.NEXT_PUBLIC_SUPABASE_BUCKET, objectName: signed.path, contentType: type },
        chunkSize: 6 * 1024 * 1024, retryDelays: [0, 3000, 5000, 10000], uploadDataDuringCreation: true,
        onProgress: (sent, total) => onProgress(Math.round(sent / total * 100)),
        onError: reject, onSuccess: resolve,
      });
      transfer.start();
    });
  }
  return { path: signed.path, type, name: file.name };
}

export default function Admin() {
  const [allowed, setAllowed] = useState(null); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [price, setPrice] = useState('');
  const [files, setFiles] = useState([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => {
    let alive = true;
    async function check() {
      const sb = browserClient(); const { data: { session } } = await sb.auth.getSession();
      if (!session) { if (alive) setAllowed(false); return; }
      const response = await fetch('/api/admin/status', { headers: { authorization: `Bearer ${session.access_token}` } });
      const result = await response.json(); if (alive) setAllowed(result.admin);
    }
    check().catch(() => { if (alive) setAllowed(false); });
    return () => { alive = false; };
  }, []);
  async function submit(event) {
    event.preventDefault();
    const images = files.filter(f=>f.type.startsWith('image/')).length, videos = files.filter(f=>f.type.startsWith('video/')).length;
    const cents = Math.round(Number(price.replace(',', '.')) * 100);
    if (!files.length || images > 5 || videos > 3 || images + videos !== files.length) return setMessage('Escolha até 5 fotos e 3 vídeos.');
    if (files.some(f=>f.size > 50 * 1024 * 1024)) return setMessage('O bucket atual permite no máximo 50 MB por arquivo.');
    if (!Number.isSafeInteger(cents) || cents < 0) return setMessage('Preço inválido.');
    setBusy(true); setMessage('Criando a prévia…');
    try {
      const preview = await makePreview(files[0]);
      const { path: preview_path } = await upload(new File([preview], 'preview.jpg', { type: 'image/jpeg' }), 'preview', () => {});
      const media = [];
      for (let i = 0; i < files.length; i++) {
        setMessage(`Enviando ${i+1} de ${files.length}…`);
        media.push(await upload(files[i], 'original', percent => setMessage(`Enviando ${i+1} de ${files.length}: ${percent}%`)));
      }
      await authorizedFetch('/api/admin/products', { title, description, price_cents: cents, media, preview_path });
      setTitle(''); setDescription(''); setPrice(''); setFiles([]); setMessage('Produto publicado com sucesso.');
    } catch (error) { setMessage(`Falha no envio: ${error.message}`); }
    finally { setBusy(false); }
  }
  return <div className="panel"><h1>Painel de vendas</h1>{allowed === null && <p>Verificando acesso…</p>}{allowed === false && <p>Entre com o e-mail administrador confirmado para publicar. <a className="btn" href="/login">Entrar</a></p>}{allowed && <form onSubmit={submit}><label>Título<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} /></label><label>Descrição<textarea value={description} onChange={e=>setDescription(e.target.value)} /></label><label>Preço em reais (0 para grátis)<input required inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} /></label><label>Fotos e vídeos<input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={e=>{setFiles(old=>[...old,...e.target.files]);e.target.value='';}} /></label><p className="muted">Até 5 fotos e 3 vídeos, no máximo 50 MB cada. A primeira mídia cria a prévia desfocada.</p><ul>{files.map((f,i)=><li key={`${f.name}-${i}`}>{f.name} <button type="button" disabled={busy} onClick={()=>setFiles(old=>old.filter((_,n)=>n!==i))}>Remover</button></li>)}</ul><button disabled={busy}>Publicar produto</button></form>}<p role="status">{message}</p></div>;
}
