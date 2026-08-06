import { Brand } from './Brand'

type PageHeaderProps = {
  title?: string
  subtitle?: string
  showBrand?: boolean
}

export function PageHeader({ title, subtitle, showBrand = false }: PageHeaderProps) {
  return (
    <header className="page-header">
      {showBrand ? <Brand size="lg" /> : title ? <h1 className="page-title">{title}</h1> : null}
      {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      <div className="header-rule" aria-hidden />
    </header>
  )
}
