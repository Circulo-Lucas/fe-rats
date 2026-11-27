type BrandProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Brand({ size = 'md', className = '' }: BrandProps) {
  return (
    <span className={['brand-wordmark', `brand-wordmark--${size}`, className].filter(Boolean).join(' ')}>
      <span className="brand-wordmark__accent">RED</span>ivinos
    </span>
  )
}
