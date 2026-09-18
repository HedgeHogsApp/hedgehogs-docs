import React from 'react'
import Image from 'next/image'
import { useDarkMode } from '@/contexts/ThemeContext'

interface LogoTextProps {
  className?: string
  width?: number
  height?: number
  forceDark?: boolean
}

const LogoText: React.FC<LogoTextProps> = ({
  className = '',
  width = 120,
  height = 24,
  forceDark = false,
}) => {
  const { darkMode } = useDarkMode()
  const shouldUseDark = forceDark || darkMode

  return (
    <div className={className}>
      <Image
        src={shouldUseDark ? '/logo_text_dark.svg' : '/logo_text_light.svg'}
        alt="hh"
        width={width}
        height={height}
        priority
      />
    </div>
  )
}

export default LogoText
