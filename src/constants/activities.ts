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
  { id: 'circulo', label: 'Círculo', points: 20, tone: 'circulo' },
  { id: 'missa_dominical', label: 'Missa dominical', points: 20, tone: 'missa' },
  {
    id: 'confissao',
    label: 'Confissão (2x ao ano: antes da Quaresma / antes de servir no EJC)',
    points: 15,
    tone: 'sacramento',
  },
  { id: 'adoracao', label: 'Adoração / visita ao Santíssimo', points: 10, tone: 'oracao' },
  {
    id: 'terco',
    label: 'Terço com REDivinos (2x por mês, cada encontro)',
    points: 10,
    tone: 'oracao',
  },
  { id: 'missa_semana', label: 'Missa em meio de semana', points: 5, tone: 'missa' },
  { id: 'eventos_sgm', label: 'Eventos (formações / ações)', points: 5, tone: 'comunidade' },
  { id: 'encontro_familia', label: 'Encontro de família', points: 5, tone: 'comunidade' },
]

export function getActivityById(id: string) {
  return ACTIVITY_TYPES.find((a) => a.id === id)
}
