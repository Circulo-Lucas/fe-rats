import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACTIVITY_TYPES, type ActivityTypeId } from '../constants/activities'
import { useAuth } from '../context/AuthContext'
import { createCheckIn } from '../lib/data'
import {
  PHOTO_RETENTION_DAYS,
  readPhotoTakenAt,
  validatePhotoFile,
  verifyPhotoMatchesCheckIn,
} from '../lib/photoProof'
import { PageHeader } from '../components/PageHeader'

export function CheckInPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activityId, setActivityId] = useState<ActivityTypeId | null>(null)
  const [note, setNote] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoTakenAt, setPhotoTakenAt] = useState<Date | null>(null)
  const [photoHint, setPhotoHint] = useState<string | null>(null)
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  async function onPhotoSelected(file: File | undefined) {
    setError(null)
    setPhotoHint(null)
    setPhotoTakenAt(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    setPhotoFile(null)

    if (!file) return

    const fileError = validatePhotoFile(file)
    if (fileError) {
      setError(fileError)
      return
    }

    setAnalyzingPhoto(true)
    const takenAt = await readPhotoTakenAt(file)
    setAnalyzingPhoto(false)

    if (!takenAt) {
      setError(
        'Não encontramos data e hora na foto. Tire a imagem na hora com a câmera (não use print ou foto baixada).',
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const check = verifyPhotoMatchesCheckIn(takenAt)
    if (!check.ok) {
      setError(check.message)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setPhotoFile(file)
    setPhotoTakenAt(takenAt)
    setPhotoPreview(URL.createObjectURL(file))
    setPhotoHint(
      `Foto de ${takenAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} — mesmo dia do registro.`,
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !activityId || !photoFile || !photoTakenAt) {
      setError('Selecione a atividade e envie uma foto de comprovação.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await createCheckIn({
      userId: user.id,
      activityTypeId: activityId,
      note: note.trim() || null,
      photoFile,
      photoTakenAt,
    })

    setSubmitting(false)

    if (insertError) {
      setError(insertError)
      return
    }

    navigate('/', { replace: true })
  }

  const selected = ACTIVITY_TYPES.find((a) => a.id === activityId)
  const canSubmit = Boolean(activityId && photoFile && photoTakenAt && !analyzingPhoto)

  return (
    <div className="page">
      <PageHeader
        title="Registrar"
        subtitle="Foto na hora da atividade para validar os pontos"
      />

      <form className="checkin-form" onSubmit={handleSubmit}>
        <fieldset className="activity-grid">
          <legend className="sr-only">Tipo de atividade</legend>
          {ACTIVITY_TYPES.map((activity) => (
            <button
              key={activity.id}
              type="button"
              data-tone={activity.tone}
              className={`activity-chip ${activityId === activity.id ? 'selected' : ''}`}
              onClick={() => setActivityId(activity.id)}
            >
              <span className="activity-chip__label">{activity.label}</span>
              <span className="activity-chip__pts">{activity.points} pt</span>
            </button>
          ))}
        </fieldset>

        {selected && (
          <p className="selected-summary muted">
            Esta atividade vale <strong className="highlight">{selected.points} pontos</strong>.
          </p>
        )}

        <div className="photo-proof">
          <label className="field">
            <span>Comprovante (foto)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              capture="environment"
              onChange={(e) => void onPhotoSelected(e.target.files?.[0])}
            />
          </label>
          <p className="photo-proof__help muted">
            A data da foto (EXIF) precisa ser o mesmo dia do registro. A imagem
            fica visível por {PHOTO_RETENTION_DAYS} dias e depois é removida do servidor; os pontos
            permanecem.
          </p>
          {analyzingPhoto && <p className="muted">Lendo data da foto…</p>}
          {photoHint && <p className="success">{photoHint}</p>}
          {photoPreview && (
            <img src={photoPreview} alt="Prévia do comprovante" className="photo-proof__preview" />
          )}
        </div>

        <label className="field">
          <span>Observação</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opcional"
            rows={3}
            maxLength={280}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Enviando…' : 'Confirmar registro'}
        </button>
      </form>
    </div>
  )
}
