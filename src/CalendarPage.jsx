import { useEffect, useRef, useState } from 'react'
import { api, fmtDay } from './api.js'

const now = new Date()
const YEAR = now.getFullYear()
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// De janvier de l'année en cours à décembre de l'année suivante.
const MONTHS = Array.from({ length: 24 }, (_, i) => {
  const year = YEAR + Math.floor(i / 12)
  const m = i % 12
  return {
    year,
    month: m,
    label: new Date(year, m, 1).toLocaleDateString('fr-FR', { month: 'long' }),
    // Semaine commençant le lundi.
    offset: (new Date(year, m, 1).getDay() + 6) % 7,
    days: new Date(year, m + 1, 0).getDate(),
  }
})

const dateKey = ({ year, month }, d) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export default function CalendarPage() {
  const track = useRef(null)
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState([])
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api().then(setEvents).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    track.current.scrollLeft = now.getMonth() * track.current.clientWidth
  }, [])

  const close = () => {
    setSelected(null)
    setError('')
  }

  useEffect(() => {
    if (!selected) return
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const byDate = Object.fromEntries(events.map((ev) => [ev.date, ev]))
  const selectedEvent = selected && byDate[selected]

  async function act(body) {
    setBusy(true)
    setError('')
    try {
      setEvents(await api('POST', { event: selectedEvent.id, ...body }))
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (await act({ action: 'register', name })) setName('')
  }

  const go = (m) =>
    track.current.scrollTo({ left: m * track.current.clientWidth, behavior: 'smooth' })

  const onScroll = (e) =>
    setMonth(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))

  return (
    <main>
      <div className="cal-head">
        <button onClick={() => go(month - 1)} disabled={month === 0} aria-label="Mois précédent">
          ‹
        </button>
        <h2>
          {MONTHS[month].label} {MONTHS[month].year}
        </h2>
        <button
          onClick={() => go(month + 1)}
          disabled={month === MONTHS.length - 1}
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>
      {!selected && error && <p className="error">{error}</p>}
      <div className="cal-weekdays">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="cal-track" ref={track} onScroll={onScroll}>
        {MONTHS.map((m, i) => (
          <div className="cal-month" key={i}>
            {Array.from({ length: m.offset }, (_, k) => (
              <div key={'e' + k} />
            ))}
            {Array.from({ length: m.days }, (_, k) => {
              const date = dateKey(m, k + 1)
              const ev = byDate[date]
              const cls = [
                'cal-day',
                i === now.getMonth() && m.year === YEAR && k + 1 === now.getDate() && 'cal-today',
              ]
                .filter(Boolean)
                .join(' ')
              const content = (
                <>
                  {k + 1}
                  {ev &&
                    (ev.booked.length > 0 ? (
                      ev.booked.map((b) => (
                        <span key={b.id} className="cal-event" title={b.name}>
                          {b.name}
                        </span>
                      ))
                    ) : (
                      <span className="cal-event cal-free">Libre</span>
                    ))}
                </>
              )
              return ev ? (
                <button key={k} className={cls} onClick={() => setSelected(date)}>
                  {content}
                </button>
              ) : (
                <div key={k} className={cls}>
                  {content}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {selectedEvent && (
        <div className="modal-backdrop" onClick={close}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={close} aria-label="Fermer">
              ×
            </button>
            <h2>{fmtDay(selectedEvent.date)}</h2>
            <p>
              {selectedEvent.title}, {selectedEvent.start.replace(':', 'h')}–
              {selectedEvent.end.replace(':', 'h')}
            </p>
            {selectedEvent.booked.length === 0 ? (
              <p className="muted">Personne n'est inscrit pour le moment.</p>
            ) : (
              <ul className="bookings">
                {selectedEvent.booked.map((b) => (
                  <li key={b.id}>
                    {b.name}
                    <button
                      className="cancel-btn"
                      disabled={busy}
                      onClick={() => act({ action: 'unregister', booking: b.id })}
                    >
                      Me désinscrire
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={onSubmit}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre prénom"
                aria-label="Votre prénom"
                maxLength={30}
                required
              />
              <button className="book-btn" disabled={busy}>
                S'inscrire
              </button>
            </form>
            {error && <p className="error">{error}</p>}
          </div>
        </div>
      )}
    </main>
  )
}
