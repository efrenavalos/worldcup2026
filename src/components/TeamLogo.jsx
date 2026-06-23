// components/TeamLogo.jsx
// Avatar con fallback inteligente para logos de equipos
import { useState } from 'react'
import { Avatar, Tooltip, Box, Typography } from '@mui/material'

/**
 * Genera variantes de URL a intentar si la original falla
 * football-data.org usa .png y .svg indistintamente
 */
const getLogoVariants = (url) => {
  if (!url) return []
  const variants = [url]
  if (url.endsWith('.png')) variants.push(url.replace('.png', '.svg'))
  if (url.endsWith('.svg')) variants.push(url.replace('.svg', '.png'))
  // Algunos equipos usan el nombre en minúsculas sin ID
  return variants
}

const TeamLogo = ({ logo, name, size = 44, sx = {} }) => {
  const variants = getLogoVariants(logo)
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)

  const handleError = () => {
    if (idx < variants.length - 1) {
      setIdx(i => i + 1)
    } else {
      setFailed(true)
    }
  }

  return (
    <Avatar
      src={failed ? undefined : variants[idx]}
      onError={handleError}
      sx={{
        width: size, height: size,
        background: '#0b1f3a',
        border: '2px solid #1e3a5f',
        fontSize: failed ? '0.7rem' : 'inherit',
        ...sx,
      }}
    >
      {failed
        ? name?.slice(0, 2).toUpperCase()  // Iniciales si todo falla
        : '⚽'
      }
    </Avatar>
  )
}

export default TeamLogo
