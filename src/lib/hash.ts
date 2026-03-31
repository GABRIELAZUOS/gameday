// Simple djb2 hash — sufficient for local profile protection
export function hashPassword(password: string): string {
  let hash = 5381
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash) ^ password.charCodeAt(i)
    hash = hash >>> 0 // keep unsigned 32-bit
  }
  return hash.toString(16)
}

export function checkPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}
