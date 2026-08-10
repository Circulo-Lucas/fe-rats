import { Link } from 'react-router-dom'

type Props = {
  compact?: boolean
}

export function NoGroupPrompt({ compact }: Props) {
  if (compact) {
    return (
      <p className="no-group-prompt no-group-prompt--compact muted">
        Para ver feed, ranking e registrar atividades,{' '}
        <Link to="/perfil#grupos">entre ou crie um grupo em Conta</Link>.
      </p>
    )
  }

  return (
    <div className="empty-state no-group-prompt">
      <p className="empty-state__title">Nenhum grupo ativo</p>
      <p className="muted">
        Você pode usar o app à vontade. Quando quiser participar, entre com o código do responsável
        ou crie um grupo novo.
      </p>
      <Link to="/perfil#grupos" className="btn btn-primary">
        Ir para Conta — grupos
      </Link>
    </div>
  )
}
