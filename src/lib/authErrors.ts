/** Mensagens amigáveis para erros do Supabase Auth (vêm em inglês). */
export function mapAuthError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('email rate limit exceeded') || m.includes('over_email_send_rate_limit')) {
    return (
      'Limite de e-mails do Supabase atingido (plano gratuito envia poucos e-mails por hora). ' +
      'Aguarde cerca de 1 hora, tente Entrar se a conta já existir, ou desligue “Confirm email” em ' +
      'Authentication → Providers → Email no painel do Supabase.'
    )
  }

  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Este e-mail já está cadastrado. Use a aba Entrar.'
  }

  if (m.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }

  if (m.includes('email not confirmed')) {
    return 'Confirme o e-mail pelo link que o Supabase enviou antes de entrar.'
  }

  if (m.includes('password should be at least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.'
  }

  if (m.includes('signup is disabled')) {
    return 'Cadastro desabilitado no Supabase. Peça ao administrador do projeto.'
  }

  return message
}
