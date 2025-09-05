import crypto from 'crypto'

/**
 * Generate a cryptographically secure random password
 * @param length - Password length (default: 16)
 * @param options - Configuration options for password generation
 */
export interface PasswordGenerationOptions {
  length?: number
  includeUppercase?: boolean
  includeLowercase?: boolean
  includeNumbers?: boolean
  includeSymbols?: boolean
  excludeSimilar?: boolean // Exclude similar looking characters like 0, O, I, l
}

export function generateSecurePassword(options: PasswordGenerationOptions = {}): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true
  } = options

  let charset = ''
  
  if (includeLowercase) {
    charset += excludeSimilar ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  }
  
  if (includeUppercase) {
    charset += excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  }
  
  if (includeNumbers) {
    charset += excludeSimilar ? '23456789' : '0123456789'
  }
  
  if (includeSymbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be enabled')
  }

  if (length < 8) {
    throw new Error('Password length must be at least 8 characters')
  }

  const randomBytes = crypto.randomBytes(length)
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }
  
  return password
}

/**
 * Generate a user-friendly temporary password
 * Uses a format like: word-word-number (e.g., tiger-moon-847)
 */
export function generateFriendlyPassword(): string {
  const adjectives = [
    'brave', 'bright', 'calm', 'clever', 'cool', 'cosmic', 'crystal', 'dawn',
    'dream', 'echo', 'fire', 'forest', 'gentle', 'golden', 'happy', 'light',
    'magic', 'ocean', 'peace', 'quick', 'rainbow', 'river', 'shadow', 'silver',
    'spark', 'star', 'storm', 'swift', 'thunder', 'tiger', 'wave', 'wind'
  ]
  
  const nouns = [
    'arrow', 'beach', 'bridge', 'castle', 'cloud', 'comet', 'crown', 'eagle',
    'flame', 'flower', 'forest', 'gem', 'island', 'journey', 'knight', 'laser',
    'moon', 'mountain', 'ocean', 'phoenix', 'planet', 'portal', 'quest', 'river',
    'rocket', 'song', 'spirit', 'summit', 'sword', 'temple', 'thunder', 'wizard'
  ]

  const adjective = adjectives[crypto.randomInt(adjectives.length)]
  const noun = nouns[crypto.randomInt(nouns.length)]
  const number = crypto.randomInt(100, 999)

  return `${adjective}-${noun}-${number}`
}

/**
 * Validate password strength
 */
export interface PasswordStrength {
  score: number // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  feedback: string[]
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) score += 20
  else feedback.push('Use at least 8 characters')

  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10

  // Character variety
  if (/[a-z]/.test(password)) score += 15
  else feedback.push('Include lowercase letters')

  if (/[A-Z]/.test(password)) score += 15
  else feedback.push('Include uppercase letters')

  if (/[0-9]/.test(password)) score += 15
  else feedback.push('Include numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score += 15
  else feedback.push('Include symbols')

  // Patterns and common issues
  if (!/(.)\1{2,}/.test(password)) score += 10 // No repeated characters
  else feedback.push('Avoid repeated characters')

  // Determine level
  let level: PasswordStrength['level']
  if (score >= 90) level = 'very-strong'
  else if (score >= 75) level = 'strong'
  else if (score >= 60) level = 'good'
  else if (score >= 40) level = 'fair'
  else level = 'weak'

  return { score, level, feedback }
}