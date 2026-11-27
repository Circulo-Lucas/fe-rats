import { useAuth } from '../context/AuthContext'
import { getVerseOfTheDay } from '../constants/verses'

function greetingFor(hour: number) {
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DailyGreeting() {
  const { profile } = useAuth()
  const now = new Date()
  const displayName = profile?.display_name?.trim()
  const verse = getVerseOfTheDay(now)

  return (
    <section className="daily-greeting" aria-label="Saudação e versículo do dia">
      <p className="daily-greeting__hello">
        {greetingFor(now.getHours())}
        {displayName ? `, ${displayName}` : ''}!
      </p>
      <blockquote className="daily-greeting__verse">
        <p>“{verse.text}”</p>
        <cite>{verse.reference}</cite>
      </blockquote>
    </section>
  )
}
