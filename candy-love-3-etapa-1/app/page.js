import { serviceClient } from '../lib/supabase';
export const dynamic = 'force-dynamic';
export default async function Home() {
  let products = [], errorMessage = '';
  try {
    const { data, error } = await serviceClient().from('products').select('id,title,description,price_cents,preview_path').eq('active', true).order('created_at', { ascending: false });
    if (error) throw error;
    products = data || [];
  } catch { errorMessage = 'A loja ainda está sendo configurada.'; }
  return <><section className="hero"><h1>Seu momento, seu encanto.</h1><p>Fotos e vídeos exclusivos da Candy Love.</p></section>{errorMessage && <p className="error">{errorMessage}</p>}<div className="grid">{products.map(p => <article className="card" key={p.id}>{p.preview_path && <img src={`/api/preview?id=${p.id}`} alt={`Prévia de ${p.title}`} />}<h2>{p.title}</h2><p>{p.description}</p><strong>{p.price_cents ? (p.price_cents / 100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : 'Grátis'}</strong></article>)}</div>{!products.length && !errorMessage && <p>Ainda não há produtos publicados.</p>}</>;
}
