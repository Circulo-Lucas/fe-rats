import exifr from 'exifr'

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024
export const PHOTO_RETENTION_DAYS = 7

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Use JPEG, PNG ou WebP (foto da câmera).'
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return 'A imagem deve ter no máximo 5 MB.'
  }
  return null
}

export async function readPhotoTakenAt(file: File): Promise<Date | null> {
  try {
    const meta = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'],
    })
    const raw = meta?.DateTimeOriginal ?? meta?.CreateDate ?? meta?.ModifyDate
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw
    if (typeof raw === 'string') {
      const d = new Date(raw)
      if (!Number.isNaN(d.getTime())) return d
    }
  } catch {
    /* sem EXIF */
  }
  return null
}

export function verifyPhotoMatchesCheckIn(
  photoTakenAt: Date,
  checkInAt: Date = new Date(),
): { ok: true } | { ok: false; message: string } {
  if (sameLocalCalendarDay(photoTakenAt, checkInAt)) {
    return { ok: true }
  }

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  return {
    ok: false,
    message: `A foto é do dia ${fmtDate(photoTakenAt)}, mas o registro é ${fmtDate(checkInAt)}. A comprovação precisa ser do mesmo dia da atividade.`,
  }
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
