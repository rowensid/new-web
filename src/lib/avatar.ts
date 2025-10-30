import crypto from 'crypto'

/**
 * Generate Gravatar URL from email
 * @param email User email
 * @param size Avatar size in pixels
 * @returns Gravatar URL
 */
export function getGravatarUrl(email: string, size: number = 80): string {
  // Trim whitespace and convert to lowercase
  const trimmedEmail = email.trim().toLowerCase()
  
  // Create MD5 hash of email
  const hash = crypto.createHash('md5').update(trimmedEmail).digest('hex')
  
  // Default avatar options: identicon, mp, identicon, monsterid, wavatar, retro, robohash, blank
  const defaultAvatar = 'identicon'
  
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultAvatar}&r=pg`
}

/**
 * Generate UI Avatar URL from name (alternative to Gravatar)
 * @param name User name
 * @param size Avatar size in pixels
 * @returns UI Avatar URL
 */
export function getUIAvatarUrl(name: string, size: number = 80): string {
  const backgroundColor = '0D8ABC'
  const color = 'FFFFFF'
  const formattedName = encodeURIComponent(name.trim())
  
  return `https://ui-avatars.com/api/?name=${formattedName}&size=${size}&background=${backgroundColor}&color=${color}&bold=true`
}

/**
 * Generate DiceBear Avatar URL from name
 * @param name User name (used as seed)
 * @param style Avatar style
 * @param size Avatar size in pixels
 * @returns DiceBear URL
 */
export function getDiceBearUrl(name: string, style: string = 'initials', size: number = 80): string {
  const seed = encodeURIComponent(name.trim().replace(/\s+/g, '-').toLowerCase())
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&size=${size}&backgroundColor=0D8ABC`
}

/**
 * Get best avatar URL with fallback chain
 * Priority: Custom Avatar > Gravatar > UI Avatar > DiceBear
 * @param user User data
 * @param size Avatar size
 * @returns Avatar URL
 */
export function getAvatarUrl(user: { name: string; email: string; avatar?: string }, size: number = 80): string {
  // If user has custom avatar, use it
  if (user.avatar) {
    return user.avatar
  }
  
  // Try Gravatar first (most popular)
  try {
    return getGravatarUrl(user.email, size)
  } catch (error) {
    console.warn('Gravatar failed, trying UI Avatar')
  }
  
  // Fallback to UI Avatar
  try {
    return getUIAvatarUrl(user.name, size)
  } catch (error) {
    console.warn('UI Avatar failed, trying DiceBear')
  }
  
  // Final fallback to DiceBear
  return getDiceBearUrl(user.name, 'initials', size)
}

/**
 * Generate initials from name
 * @param name User name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  // Take first letter of first and last name
  return `${parts[0].substring(0, 1)}${parts[parts.length - 1].substring(0, 1)}`.toUpperCase()
}

/**
 * Generate consistent color from name
 * @param name User name
 * @returns Tailwind color class
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'from-red-500 to-pink-500',
    'from-orange-500 to-yellow-500',
    'from-amber-500 to-orange-500',
    'from-yellow-500 to-amber-500',
    'from-lime-500 to-green-500',
    'from-green-500 to-emerald-500',
    'from-teal-500 to-cyan-500',
    'from-cyan-500 to-blue-500',
    'from-sky-500 to-indigo-500',
    'from-blue-500 to-violet-500',
    'from-indigo-500 to-purple-500',
    'from-purple-500 to-pink-500',
    'from-rose-500 to-red-500',
  ]
  
  // Generate hash from name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Use hash to select color
  const index = Math.abs(hash) % colors.length
  return colors[index]
}