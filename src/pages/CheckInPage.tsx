import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACTIVITY_TYPES, type ActivityTypeId } from '../constants/activities'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import { createCheckIn } from '../lib/data'
import { PHOTO_RETENTION_DAYS, validatePhotoFile } from '../lib/photoProof'
import { PageHeader } from '../components/PageHeader'

export function CheckInPage() {
  const { user } = useAuth()
  const { community } = useCommunity()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activityId, setActivityId] = useState<ActivityTypeId | null>(null)
  const [note, setNote] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  function onPhotoSelected(file: File | undefined) {
    setError(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    setPhotoFile(null)

    if (!file) return

    const fileError = validatePhotoFile(file)
    if (fileError) {
      setError(fileError)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !community || !activityId || !photoFile) {
      setError('Selecione a atividade e envie uma foto de comprovação.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await createCheckIn({
      userId: user.id,
      communityId: community.id,
      activityTypeId: activityId,
      note: note.trim() || null,
      photoFile,
    })

    setSubmitting(false)

    if (insertError) {
      setError(insertError)
      return
    }

    navigate('/', { replace: true })
  }

  const selected = ACTIVITY_TYPES.find((a) => a.id === activityId)
  const canSubmit = Boolean(activityId && photoFile && community)

  return (
    <div className="page">
      <PageHeader title="Registrar" subtitle="Comprovante em foto da atividade" />

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
              onChange={(e) => onPhotoSelected(e.target.files?.[0])}
            />
          </label>
          <p className="photo-proof__help muted">
            A foto fica visível por {PHOTO_RETENTION_DAYS} dias e depois é removida; os pontos
            permanecem.
          </p>
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
