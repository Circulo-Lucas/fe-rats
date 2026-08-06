# FéRats

App para a comunidade registrar presença nas atividades da igreja, somar pontos e acompanhar a participação do grupo.

## Stack

- React + TypeScript (Vite)
- Supabase (Auth, Postgres, Storage, RLS)

## Pontuação

| Atividade | Pontos |
|-----------|--------|
| Participação no Círculo | 5 |
| Missa dominical | 2 |
| Adoração / Santíssimo | 1 |
| Missa em meio de semana | 1 |
| Sacramentos | 1 |
| Eventos do SGM | 1 |

## Começar

1. Crie um projeto em [Supabase](https://supabase.com).
2. No **SQL Editor**, rode na ordem:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_check_in_photos_storage.sql`
3. Em **Authentication → Providers**, habilite **Email**.
4. Copie `.env.example` para `.env` com URL e chave `anon`.
5. `npm install` e `npm run dev`.

**Produção:** [https://fe-rats.vercel.app](https://fe-rats.vercel.app) — configure Supabase + variáveis na Vercel: `docs/SUPABASE_SETUP.md`.

## Comprovante em foto

- Cada check-in exige **uma foto** tirada na hora.
- O app lê a **data EXIF** da imagem e só aceita se for o **mesmo dia** do registro (fuso do dispositivo; lógica em `src/lib/photoProof.ts`).
- A foto fica no bucket `check-in-proofs` por **7 dias** (`photo_expires_at`); depois some do feed e do Storage, mas **os pontos continuam**.

### Limpar fotos expiradas (1× por dia)

1. Faça deploy da Edge Function `supabase/functions/purge-expired-photos` (`supabase functions deploy purge-expired-photos`).
2. Defina o secret `CRON_SECRET` no projeto.
3. Agende um cron (Dashboard → Edge Functions → Schedules ou serviço externo) com `POST` na URL da function e header `Authorization: Bearer <CRON_SECRET>`.

## Rotas

- `/entrar` — login e cadastro
- `/` — registros da comunidade
- `/registrar` — nova atividade + comprovante
- `/ranking` — pontuação acumulada
- `/perfil` — conta e critérios de pontos

## Limitações da verificação EXIF

A checagem é feita no navegador e confia nos metadados da foto. Prints, imagens reenviadas ou editadas podem não ter EXIF ou ter horário incorreto. Para auditoria mais rígida, seria necessário validação no servidor ou moderação manual.
