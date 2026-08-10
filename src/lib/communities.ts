export function generateInviteCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export function mapCommunityError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('não autenticado') || m.includes('not authenticated')) {
    return 'Sessão expirada. Saia e entre de novo.'
  }
  if (m.includes('inválido') || m.includes('invalid')) {
    return 'Código de grupo inválido.'
  }
  if (m.includes('permission') || m.includes('policy') || m.includes('42501')) {
    return 'Sem permissão no Supabase. Rode a migration 008 no SQL Editor.'
  }
  if (m.includes('create_community') && m.includes('does not exist')) {
    return 'Função create_community não existe. Rode 003 e 008 no Supabase.'
  }
  return message
}
