# Candy Love 3.0 — primeira etapa

Loja Next.js para Cloudflare Workers com Supabase Auth, Postgres e Storage privado.

Esta etapa implementa catálogo, cadastro/login, painel administrador, envio de várias fotos/vídeos e prévia desfocada. **Não há checkout ou download nesta etapa; não use para vender ainda.** O Pix e a liberação de compras serão adicionados depois de testar cadastro e upload no ambiente publicado.

## Banco e arquivos

Execute `schema.sql` no SQL Editor do novo projeto Supabase. Crie um bucket **privado** com o nome exato `andy-love-private`. O bucket criado está com limite de 50 MB por arquivo. A imagem de teste do painel Supabase pode ser removida.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` durante desenvolvimento. No Cloudflare configure os nomes abaixo exatamente:

| Nome | Tipo | Valor |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Variável | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Variável | Chave `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | **Segredo** | Chave secreta do projeto Supabase; nunca publique no Git |
| `SUPABASE_BUCKET` | Variável | `andy-love-private` |
| `NEXT_PUBLIC_SUPABASE_BUCKET` | Variável | `andy-love-private` |
| `ADMIN_EMAIL` | Variável | `fmaoni2@gmail.com` |

Os valores públicos da URL e da chave publicável já estão em `.env.example`; confira antes do deploy. Não coloque a chave secreta no repositório.

## Instalar e publicar

```sh
npm ci
npm run build
npx opennextjs-cloudflare build
npm run deploy
```

Para usar o Git conectado no Cloudflare: comando de build `npm run build`; comando de deploy `npm run deploy`; diretório raiz `/`. O deploy executa uma segunda compilação para gerar o Worker.

No Supabase, configure em Authentication → URL Configuration a URL HTTPS final do site e o endereço de retorno para confirmação de e-mail. Crie sua conta pelo site, confirme o e-mail e entre com o endereço definido em `ADMIN_EMAIL`. Apenas essa conta pode publicar; a verificação acontece no servidor.

## Validação

1. Confirme que a home carrega sem mensagem de configuração.
2. Cadastre uma conta de teste, confirme o e-mail e entre.
3. Com a conta administradora, abra `/admin` e publique uma foto pequena. Verifique que aparece na home com prévia desfocada.
4. Envie várias fotos e um vídeo menor que 50 MB. O original fica no bucket privado.

Compilações `npm run build` e `npx opennextjs-cloudflare build` foram executadas localmente. Cadastro, upload e acesso ao banco em produção dependem das variáveis e precisam de teste no Worker publicado.
