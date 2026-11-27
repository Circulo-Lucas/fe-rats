# REDivinos

App para a comunidade registrar presença nas atividades da igreja, somar pontos e acompanhar a participação do grupo.

## Stack

- React + TypeScript (Vite)
- Supabase (Auth, Postgres, Storage, RLS)

## Pontuação

| Atividade | Pontos |
|-----------|--------|
| Círculo | 20 |
| Missa dominical | 20 |
| Confissão (2x ao ano: antes da Quaresma / antes de servir no EJC) | 15 |
| Adoração / visita ao Santíssimo | 10 |
| Terço com REDivinos (2x por mês, cada encontro) | 10 |
| Missa em meio de semana | 5 |
| Eventos (formações / ações) | 5 |
| Encontro de família | 5 |

## Começar

1. Crie um projeto em [Supabase](https://supabase.com).
2. No **SQL Editor**, rode as migrations de `supabase/migrations/` na ordem numérica (detalhes em `docs/SUPABASE_SETUP.md`).
3. Em **Authentication → Providers**, habilite **Email**.
4. Copie `.env.example` para `.env` com URL e chave `anon`.
5. `npm install` e `npm run dev`.

**Produção:** [https://fe-rats.vercel.app](https://fe-rats.vercel.app) — configure Supabase + variáveis na Vercel: `docs/SUPABASE_SETUP.md`.

## Comprovante em foto

- Cada check-in exige **uma foto** de comprovação.
- A foto fica no bucket `check-in-proofs` por **7 dias** (`photo_expires_at`); depois some do feed e do Storage, mas **os pontos continuam**.

### Limpar fotos expiradas (1× por dia)

1. Faça deploy da Edge Function `supabase/functions/purge-expired-photos` (`supabase functions deploy purge-expired-photos`).
2. Defina o secret `CRON_SECRET` no projeto.
3. Agende um cron (Dashboard → Edge Functions → Schedules ou serviço externo) com `POST` na URL da function e header `Authorization: Bearer <CRON_SECRET>`.

## Rotas

- `/entrar` — login e cadastro
- `/` — saudação do dia e registros do grupo
- `/registrar` — nova atividade + comprovante
- `/ranking` — pontuação acumulada
- `/perfil` — conta, grupos e critérios de pontos
