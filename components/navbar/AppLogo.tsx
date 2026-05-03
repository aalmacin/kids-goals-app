'use client'

interface AppLogoProps {
  className?: string
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="Kids Goals"
      className={className ?? 'h-8 w-auto'}
      onError={(e) => {
        e.currentTarget.style.display = 'none'
        e.currentTarget.nextElementSibling?.classList.remove('hidden')
      }}
    />
  )
}
