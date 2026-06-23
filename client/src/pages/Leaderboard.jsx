import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Leaderboard() {
  const { token, API } = useAuth()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/challenges/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setLeaders(res.data))
      .finally(() => setLoading(false))
  }, [])

  const medal = (i) => ['🥇', '🥈', '🥉'][i] || i + 1

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'monospace', marginBottom: '2rem' }}>
          🏆 <span style={{ color: 'var(--accent)' }}>Rankings</span>
        </h1>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>Top Earners</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Nairobi Region · All Time</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '3rem' }}>Loading...</div>
          ) : leaders.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '3rem' }}>
              No players yet. Be the first to compete!
            </div>
          ) : leaders.map((l, i) => (
            <div key={l.id} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border)',
              transition: 'background 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700,
                width: 32, textAlign: 'center',
                color: i === 0 ? 'var(--gold)' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text3)'
              }}>{medal(i)}</div>

              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `hsl(${l.id * 60}, 60%, 50%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0
              }}>
                {l.username.slice(0, 2).toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
                  {l.wins}W · {l.losses}L · ELO {l.elo}
                </div>
              </div>

              <div style={{
                fontSize: '0.8rem', color: 'var(--neon)', fontWeight: 600,
                background: 'rgba(0,255,179,0.08)', padding: '0.15rem 0.5rem',
                borderRadius: '100px'
              }}>{l.win_rate}% WR</div>

              <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 600, color: 'var(--gold)', minWidth: 100, textAlign: 'right' }}>
                KES {Number(l.total_won).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}