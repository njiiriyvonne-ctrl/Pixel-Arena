import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '2rem', paddingTop: '80px',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(124,92,255,0.15) 0%, transparent 60%)'
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        background: 'rgba(0,255,179,0.08)', border: '1px solid rgba(0,255,179,0.2)',
        color: 'var(--neon)', padding: '0.35rem 1rem', borderRadius: '100px',
        fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em',
        marginBottom: '1.5rem'
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1.5s infinite' }} />
        NAIROBI'S #1 GAMING ARENA
      </div>

      <h1 style={{
        fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 800,
        lineHeight: 0.95, marginBottom: '1.25rem', letterSpacing: '-0.02em'
      }}>
        COMPETE.<br />EARN.<br />
        <span style={{ color: 'var(--neon)' }}>DOMINATE.</span>
      </h1>

      <p style={{
        fontSize: '1.1rem', color: 'var(--text2)', maxWidth: '500px',
        lineHeight: 1.7, marginBottom: '2.5rem'
      }}>
        Challenge players, place your stake, play head-to-head.
        Every match is screen recorded and streamed live.
        Winner takes the pot via M-Pesa instantly.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {user ? (
          <>
            <Link to="/lobby" className="btn btn-neon" style={{ padding: '0.85rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius)' }}>
              Browse Challenges
            </Link>
            <Link to="/live" className="btn btn-ghost" style={{ padding: '0.85rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius)' }}>
              Watch Live
            </Link>
          </>
        ) : (
          <>
            <Link to="/register" className="btn btn-neon" style={{ padding: '0.85rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius)' }}>
              🚀 Get Started Free
            </Link>
            <Link to="/login" className="btn btn-ghost" style={{ padding: '0.85rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius)' }}>
              Login
            </Link>
          </>
        )}
      </div>

      <div style={{
        display: 'flex', gap: '3rem', justifyContent: 'center',
        marginTop: '4rem', flexWrap: 'wrap'
      }}>
        {[
          { num: 'KES 1.2M', lbl: 'Paid out today' },
          { num: '847', lbl: 'Active players' },
          { num: '94%', lbl: 'Instant payouts' },
          { num: '15+', lbl: 'Game titles' },
        ].map(({ num, lbl }) => (
          <div key={lbl} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'monospace' }}>{num}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{lbl}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}