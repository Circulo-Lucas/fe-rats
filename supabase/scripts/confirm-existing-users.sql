-- Rode UMA VEZ no SQL Editor se já existirem contas “presas” sem confirmar.
-- Isso NÃO desliga “Confirm email” no painel — só libera quem já cadastrou.

UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email_confirmed_at IS NULL;
