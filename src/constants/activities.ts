export type ActivityTypeId =
  | 'circulo'
  | 'missa_dominical'
  | 'adoracao'
  | 'missa_semana'
  | 'confissao'
  | 'eventos_sgm'
  | 'encontro_familia'
  | 'terco'

export type ActivityTone = 'circulo' | 'missa' | 'oracao' | 'sacramento' | 'comunidade'

export const ACTIVITY_TYPES: {
  id: ActivityTypeId
  label: string
  points: number
  tone: ActivityTone
}[] = [
  { id: 'circulo', label: 'Participação no Círculo', points: 5, tone: 'circulo' },
  { id: 'missa_dominical', label: 'Missa dominical', points: 2, tone: 'missa' },
  {
    id: 'adoracao',
    label: 'Adoração / visita ao Santíssimo',
    points: 1,
    tone: 'oracao',
  },
  { id: 'missa_semana', label: 'Missa em meio de semana', points: 1, tone: 'missa' },
  { id: 'confissao', label: 'Confissão', points: 15, tone: 'sacramento' },
  {
    id: 'eventos_sgm',
    label: 'Eventos do SGM (formações / ações sociais)',
    points: 1,
    tone: 'comunidade',
  },
  { id: 'encontro_familia', label: 'Encontro da família', points: 5, tone: 'comunidade' },
  { id: 'terco', label: 'Rezar o terço', points: 3, tone: 'oracao' },
]

export function getActivityById(id: string) {
  return ACTIVITY_TYPES.find((a) => a.id === id)
}
