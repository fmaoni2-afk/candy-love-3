import './globals.css';
export const metadata = { title: 'Candy Love 3.0', description: 'Fotos e vídeos exclusivos' };
export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body><header><a className="brand" href="/">Candy Love <span>3.0</span></a><nav><a href="/">Loja</a><a href="/login">Minha conta</a><a href="/admin">Painel</a></nav></header><main>{children}</main><footer>© Candy Love</footer></body></html>;
}
