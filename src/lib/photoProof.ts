export const PHOTO_RETENTION_DAYS = 7

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Use JPEG, PNG ou WebP.'
  }
  return null
}

export function photoExpiresAt(from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + PHOTO_RETENTION_DAYS)
  return d.toISOString()
}

export function isProofPhotoVisible(
  photoUrl: string | null | undefined,
  photoExpiresAtIso: string | null | undefined,
): boolean {
  if (!photoUrl) return false
  if (!photoExpiresAtIso) return true
  return new Date(photoExpiresAtIso).getTime() > Date.now()
}
