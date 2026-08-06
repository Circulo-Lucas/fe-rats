# Configurar Supabase para o FéRats

Checklist na ordem. Projeto novo no [Supabase Dashboard](https://supabase.com/dashboard).

---

## 1. Criar o projeto

1. **New project** → escolha organização, nome (ex. `ferats`), senha do banco (guarde).
2. Aguarde o projeto ficar **Active** (1–2 min).

---

## 2. Banco de dados (SQL)

1. Menu **SQL Editor** → **New query**.
2. Copie **todo** o conteúdo de `supabase/migrations/001_initial.sql`, cole e **Run**.
3. Nova query: copie `supabase/migrations/002_check_in_photos_storage.sql`, **Run**.

**Sucesso:** em **Table Editor** devem aparecer `profiles`, `activity_types`, `check_ins`.  
Em **Storage** deve existir o bucket `check-in-proofs`.

### Se você já tinha rodado o `001` antigo (sem colunas de foto)

Rode só isto no SQL Editor:

```sql
alter table public.check_ins add column if not exists photo_storage_path text;
alter table public.check_ins add column if not exists photo_taken_at timestamptz;
alter table public.check_ins add column if not exists photo_expires_at timestamptz;
```

Depois rode o `002` inteiro (bucket + políticas).

### Erro “policy already exists” no 002

As políticas de Storage já existem. Pode ignorar se o bucket `check-in-proofs` já estiver criado com as 3 policies em **Storage → Policies**.

---

## 3. Autenticação (login com e-mail, **sem** confirmar e-mail)

1. **Authentication** → **Providers** → **Email**.
2. Deixe **Enable Email provider** ligado.
3. **Desligue** **Confirm email** e salve — cadastro entra direto, sem link no e-mail (recomendado para o FéRats).

O repositório já traz `supabase/config.toml` com `enable_confirmations = false`. Para aplicar no projeto na nuvem (alternativa ao passo 3 manual):

```bash
npx supabase login
npx supabase link --project-ref kcbeuvvoyorcddhbajnt
npx supabase config push
```

4. Contas antigas sem confirmar: rode **uma vez** `supabase/scripts/confirm-existing-users.sql` no SQL Editor.

### Limite “email rate limit exceeded”

No plano gratuito o Supabase envia **poucos e-mails por hora** (cadastros repetidos, confirmação, “esqueci senha” contam).

**O que fazer:**

1. Desligue **Confirm email** (passo 3 acima) — principal ajuste para o FéRats.
2. **Authentication** → **Rate Limits** — revise limites se o painel mostrar essa seção.
3. Espere ~1 h e tente de novo, ou use **Entrar** se o cadastro já tiver sido criado antes.
4. Em **Authentication** → **Users**, confira se o usuário já existe e, se quiser, confirme manualmente o e-mail.


### URLs do app (redirects de login e e-mail)

**Authentication** → **URL Configuration**:

| Campo | Valor |
|--------|--------|
| **Site URL** | `https://fe-rats.vercel.app` |
| **Redirect URLs** (adicione **todas**, uma por linha) | `https://fe-rats.vercel.app/**` |
| | `http://localhost:5173/**` |

A **Site URL** é para onde o Supabase manda o usuário por padrão (links de confirmação, etc.).  
Manter `localhost` em **Redirect URLs** permite testar no PC sem tirar a produção.

---

## 4. Chaves no projeto React

1. **Project Settings** (ícone engrenagem) → **API**.
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** (JWT que começa com `eyJ…`) → `VITE_SUPABASE_ANON_KEY`  
     Não use a *publishable key* (`sb_publishable_…`) neste projeto — o app usa a chave **anon** clássica.

3. Na pasta do projeto, crie o arquivo `.env` (não commitar no Git):

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Reinicie o servidor: pare o `npm run dev` e rode de novo.

### Produção (Vercel) — https://fe-rats.vercel.app

1. [Vercel Dashboard](https://vercel.com) → projeto **fe-rats** → **Settings** → **Environment Variables**.
2. Crie (para **Production**, e opcionalmente Preview/Development):

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | chave **anon** |

3. **Deployments** → último deploy → **⋯** → **Redeploy** (obrigatório após mudar env; o Vite embute as variáveis no build).

Sem essas variáveis, em produção a tela `/entrar` mostra aviso de Supabase não configurado.

**Nunca** use a chave `service_role` no front-end — só no servidor / Edge Functions.

---

## 5. Storage (conferência manual)

**Storage** → bucket `check-in-proofs`:

- **Public bucket**: ligado (o app usa URL pública; leitura exige usuário logado via policy).
- **File size limit**: 5 MB (5242880 bytes).
- **Allowed MIME types**: jpeg, png, webp, heic, heif (se a UI do Supabase permitir editar).

Policies esperadas (3):

- Leitura: usuários **authenticated**
- Insert: pasta = `auth.uid()` (primeira pasta do caminho = id do usuário)
- Delete: mesma regra

---

## 6. Testar no app

1. `npm run dev` → `http://localhost:5173`
2. **Cadastro** com e-mail e senha (mín. 6 caracteres).
3. Se “Confirm email” estiver ligado, confirme o link no e-mail antes de entrar.
4. **Registrar**: escolha atividade + foto **tirada hoje** (com EXIF).
5. Veja o **Início** (feed) e **Pontuação** (ranking).

### Problemas comuns

| Sintoma | O que verificar |
|--------|------------------|
| Tela pede configurar `.env` | `.env` na raiz, nomes `VITE_`, reiniciar `npm run dev` |
| Erro ao cadastrar / RLS | Rodou o `001` completo? Trigger `on_auth_user_created` criou perfil? |
| Erro no upload da foto | Rodou o `002`? Bucket `check-in-proofs` existe? Usuário logado? |
| “Não encontramos data na foto” | Use foto da câmera no mesmo dia; evite print/WhatsApp sem EXIF |
| Login não funciona após cadastro | Desligue “Confirm email” ou confirme o e-mail |
| **email rate limit exceeded** | Desligue “Confirm email”; aguarde 1 h; tente **Entrar** |

---

## 7. (Opcional) Apagar fotos após 7 dias

As fotos somem do feed após `photo_expires_at`, mas o arquivo no Storage só some se rodar a limpeza:

1. Instale [Supabase CLI](https://supabase.com/docs/guides/cli) e faça `supabase link`.
2. Deploy: `supabase functions deploy purge-expired-photos`
3. Defina secret `CRON_SECRET` no projeto.
4. Agende POST diário na function com header `Authorization: Bearer <CRON_SECRET>`.

Detalhes em `README.md`. Pode deixar para depois; o app funciona sem isso (só ocupa Storage a mais).

---

## Resumo rápido

1. SQL `001` → SQL `002`  
2. Email auth (+ desligar confirm email em dev)  
3. Supabase URLs: Site `https://fe-rats.vercel.app`, redirects Vercel + localhost  
4. `.env` local **e** variáveis na Vercel (`VITE_SUPABASE_*`) + redeploy  
5. `npm run dev` local ou abrir https://fe-rats.vercel.app/entrar
