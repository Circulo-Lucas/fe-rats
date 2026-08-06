type BrandProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Brand({ size = 'md', className = '' }: BrandProps) {
  return (
    <span className={['brand-wordmark', `brand-wordmark--${size}`, className].filter(Boolean).join(' ')}>
      Fé<span className="brand-wordmark__rats">Rats</span>
    </span>
  )
}
