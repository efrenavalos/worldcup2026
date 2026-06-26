// components/TeamLogo.jsx
import { useState } from 'react'
import { Avatar } from '@mui/material'

// Mapa de nombre de equipo → código de país para flagcdn.com
const COUNTRY_CODES = {
 // América
 'Mexico': 'mx', 'United States': 'us', 'Canada': 'ca',
 'Brazil': 'br', 'Argentina': 'ar', 'Uruguay': 'uy',
 'Colombia': 'co', 'Ecuador': 'ec', 'Chile': 'cl',
 'Peru': 'pe', 'Venezuela': 've', 'Bolivia': 'bo',
 'Paraguay': 'py', 'Costa Rica': 'cr', 'Panama': 'pa',
 'Honduras': 'hn', 'Guatemala': 'gt', 'Jamaica': 'jm',
 'El Salvador': 'sv', 'Cuba': 'cu', 'Haiti': 'ht',
 'Trinidad and Tobago': 'tt','Curaçao': 'cw',
 // Europa
 'France': 'fr', 'Germany': 'de', 'Spain': 'es',
 'Portugal': 'pt', 'England': 'gb-eng', 'Netherlands': 'nl',
 'Belgium': 'be', 'Italy': 'it', 'Croatia': 'hr',
 'Switzerland': 'ch', 'Denmark': 'dk', 'Sweden': 'se',
 'Norway': 'no', 'Poland': 'pl', 'Ukraine': 'ua',
 'Turkey': 'tr', 'Serbia': 'rs', 'Romania': 'ro',
 'Hungary': 'hu', 'Czech Republic': 'cz', 'Austria': 'at',
 'Scotland': 'gb-sct', 'Wales': 'gb-wls', 'Greece': 'gr',
 'Slovakia': 'sk', 'Slovenia': 'si', 'Albania': 'al',
 'Kosovo': 'xk', 'Georgia': 'ge', 'Azerbaijan': 'az',
 'Russia': 'ru', 'Finland': 'fi', 'Ireland': 'ie',
 'Iceland': 'is', 'North Macedonia': 'mk', 'Montenegro': 'me',
 'Bosnia-Herzegovina': 'ba', 'Bulgaria': 'bg', 'Belarus': 'by',
 // África
 'Morocco': 'ma', 'Senegal': 'sn', 'Nigeria': 'ng',
 'Cameroon': 'cm', 'Ghana': 'gh', "Ivory Coast": 'ci',
 'Egypt': 'eg', 'Tunisia': 'tn', 'Algeria': 'dz',
 'Mali': 'ml', 'Burkina Faso': 'bf', 'Guinea': 'gn',
 'Tanzania': 'tz', 'Congo DR': 'cd', 'Zambia': 'zm',
 'Zimbabwe': 'zw', 'Mozambique': 'mz', 'South Africa': 'za',
 'Uganda': 'ug', 'Kenya': 'ke', 'Ethiopia': 'et',
 'Namibia': 'na', 'Benin': 'bj', 'Cape Verde Islands': 'cv',
 'Comoros': 'km', 'Equatorial Guinea': 'gq',
 // Asia
 'Japan': 'jp', 'South Korea': 'kr', 'Australia': 'au',
 'Saudi Arabia': 'sa', 'Iran': 'ir', 'Qatar': 'qa',
 'United Arab Emirates': 'ae', 'Bahrain': 'bh', 'Oman': 'om',
 'China PR': 'cn', 'Uzbekistan': 'uz', 'Indonesia': 'id',
 'Iraq': 'iq', 'Jordan': 'jo', 'Kuwait': 'kw',
 'Thailand': 'th', 'Vietnam': 'vn', 'India': 'in',
 'Philippines': 'ph', 'Kyrgyzstan': 'kg', 'Tajikistan': 'tj',
 // Oceanía
 'New Zealand': 'nz', 'Fiji': 'fj', 'Papua New Guinea': 'pg',
}

/**
* Genera variantes de URL a intentar en orden:
* 1. URL original de football-data.org (.png)
* 2. Variante .svg
* 3. Bandera de flagcdn.com como último fallback
*/
const getLogoVariants = (url, name) => {
 const variants = []
 if (url) {
   variants.push(url)
   if (url.endsWith('.png')) variants.push(url.replace('.png', '.svg'))
   if (url.endsWith('.svg')) variants.push(url.replace('.svg', '.png'))
 }
 // Fallback: bandera por código de país
 const code = COUNTRY_CODES[name]
 if (code) variants.push(`https://flagcdn.com/w80/${code}.png`)
 return variants
}

const TeamLogo = ({ logo, name, size = 44, sx = {} }) => {
 const variants = getLogoVariants(logo, name)
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
       borderRadius: failed ? '50%' : '50%',
       ...sx,
     }}
   >
     {failed
       ? name?.slice(0, 2).toUpperCase()
       : '⚽'
     }
   </Avatar>
 )
}

export default TeamLogo