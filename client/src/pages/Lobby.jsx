import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const GAMES = ['All Games', 'FIFA 25', 'Call of Duty', 'NBA 2K25', 'Mortal Kombat', 'FC 25', 'Tekken 8']

const COLORS = {
  'FIFA 25': '#7C5CFF', 'Call of Duty': '#FF4757',
  'NBA 2K25': '#FFB800', 'Mortal Kombat': '#00FFB3',
  'FC 25': '#FF6B35', 'Tekken 8': '#A29BFE'
}

const EMOJIS = {
  'FIFA 25': '⚽', 'Call of Duty': '🔫',
  'NBA 2K25': '🏀', 'Mortal Kombat': '🥊',
  'FC 25': '🎯', 'Tekken 8': '👊'
}

export default function Lobby() {
  const { token, API } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [filter, setFilter] = useState('All Games')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ game: 'FIFA 25', title: '', rules: '', entry_fee: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchChallenges = async () => {
    try {
      const res = await axios.get(`${API}/challenges`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setChallenges(res.data)
    } catch (err) {
      showToast('❌', 'Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchChallenges() }, [])

  const showToast = (icon, msg) => {
    setToast({ icon, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.post(`${API}/challenges/create`, {
        ...form, entry_fee: parseFloat(form.entry_fee)
      }, { headers: { Authorization: `Bearer ${token}` } })
      setShowCreate(false)
      setForm({ game: 'FIFA 25', title: '', rules: '', entry_fee: '' })
      showToast('🎮', 'Challenge created! Waiting for opponent.')
      fetchChallenges()
    } catch (err) {
      showToast('❌', err.response?.data?.error || 'Failed to create challenge')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (id) => {
    setSubmitting(true)
    try {
      await axios.post(`${API}/challenges/join/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowJoin(null)
      showToast('⚔️', 'Joined! Match is now live.')
      fetchChallenges()
    } catch (err) {
      showToast('❌', err.response?.data?.error || 'Failed to join')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = filter === 'All Games'
    ? challenges
    : challenges.filter(c => c.game === filter)

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'monospace' }}>
              Game <span style={{ color: 'var(--accent)' }}>Lobby</span>
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: '0.25rem' }}>
              {challenges.filter(c => c.status === 'open').length} open ·{' '}
              {challenges.filter(c => c.status === 'live').length} live
            </div>
          </div>
          <button className="btn btn-neon" onClick={() => setShowCreate(true)}>
            + Create Challenge
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {GAMES.map(g => (
            <button key={g} onClick={() => setFilter(g)} style={{
              padding: '0.35rem 0.9rem', borderRadius: '100px',
              background: filter === g ? 'var(--accent)' : 'var(--bg3)',
              border: `1px solid ${filter === g ? 'var(--accent)' : 'var(--border)'}`,
              color: filter === g ? '#fff' : 'var(--text2)',
              fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s'
            }}>{g}</button>
          ))}
        </div>

        {/* Challenge Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '4rem' }}>Loading challenges...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
            No challenges yet. Be the first to create one!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {filtered.map(c => (
              <div key={c.id} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: 5, background: COLORS[c.game] || 'var(--accent)' }} />
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.1em', padding: '0.2rem 0.6rem', borderRadius: '100px',
                      background: 'rgba(124,92,255,0.15)', color: '#A07DFF',
                      border: '1px solid rgba(124,92,255,0.25)'
                    }}>{EMOJIS[c.game]} {c.game}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem',
                      borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.3rem',
                      background: c.status === 'live' ? 'rgba(255,71,87,0.1)' : 'rgba(0,255,179,0.1)',
                      color: c.status === 'live' ? 'var(--red)' : 'var(--neon)',
                      border: `1px solid ${c.status === 'live' ? 'rgba(255,71,87,0.2)' : 'rgba(0,255,179,0.2)'}`
                    }}>
                      {c.status === 'live' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />}
                      {c.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{c.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '1rem' }}>
                    by {c.creator_name} · ELO {c.creator_elo}
                    {c.rules && <> · {c.rules}</>}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: '1rem', borderTop: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Entry</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 700, color: 'var(--neon)' }}>
                        KES {Number(c.entry_fee).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      {c.status === 'open' ? (
                        <button className="btn btn-primary" style={{ fontSize: '0.8rem' }}
                          onClick={() => setShowJoin(c)}>
                          Join Challenge
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Match Live 🔴</span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prize</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600, color: 'var(--gold)' }}>
                        KES {Number(c.prize_pool).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 200
        }} onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
            <button onClick={() => setShowCreate(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text2)', width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: '1.1rem'
            }}>✕</button>
            <h2 style={{ fontFamily: 'monospace', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Create Challenge</h2>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Set your terms — we'll find you an opponent</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Game</label>
                <select value={form.game} onChange={e => setForm({ ...form, game: e.target.value })}>
                  {GAMES.slice(1).map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Challenge Title</label>
                <input placeholder="e.g. Weekend 1v1 Showdown" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Entry Fee (KES)</label>
                <input type="number" placeholder="e.g. 500" min="10" value={form.entry_fee}
                  onChange={e => setForm({ ...form, entry_fee: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Rules (optional)</label>
                <input placeholder="e.g. Best of 3, no custom tactics" value={form.rules}
                  onChange={e => setForm({ ...form, rules: e.target.value })} />
              </div>
              <div style={{
                background: 'rgba(0,255,179,0.06)', border: '1px solid rgba(0,255,179,0.15)',
                borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1rem',
                fontSize: '0.8rem', color: 'var(--text2)'
              }}>
                📹 Match will be <strong style={{ color: 'var(--text)' }}>screen recorded</strong> and available for live broadcast automatically.
              </div>
              <button className="btn btn-neon btn-block" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : '🎮 Post Challenge'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* JOIN MODAL */}
      {showJoin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 200
        }} onClick={e => e.target === e.currentTarget && setShowJoin(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
            <button onClick={() => setShowJoin(null)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text2)', width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: '1.1rem'
            }}>✕</button>
            <h2 style={{ fontFamily: 'monospace', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Join Challenge</h2>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {EMOJIS[showJoin.game]} {showJoin.game} · {showJoin.title}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Entry Fee</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, color: 'var(--neon)' }}>
                  KES {Number(showJoin.entry_fee).toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prize Pool</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>
                  KES {Number(showJoin.prize_pool).toLocaleString()}
                </div>
              </div>
            </div>
            <div style={{
              background: 'rgba(124,92,255,0.07)', border: '1px solid rgba(124,92,255,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1.25rem',
              fontSize: '0.8rem', color: 'var(--text2)'
            }}>
              ✅ Match will be <strong style={{ color: 'var(--text)' }}>screen recorded</strong> and live broadcasted. Entry fee deducted from wallet on join.
            </div>
            <button className="btn btn-neon btn-block" onClick={() => handleJoin(showJoin.id)} disabled={submitting}>
              {submitting ? 'Joining...' : '⚔️ Confirm & Enter'}
            </button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          background: 'var(--bg3)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
          display: 'flex', gap: '0.75rem', alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 999,
          animation: 'slideUp 0.3s ease'
        }}>
          <span style={{ fontSize: '1.2rem' }}>{toast.icon}</span>
          <span style={{ fontSize: '0.9rem' }}>{toast.msg}</span>
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}