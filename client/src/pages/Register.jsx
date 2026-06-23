import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.phone)
      navigate('/lobby')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,179,0.08) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontFamily: 'monospace', fontSize: '1.8rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #7C5CFF, #00FFB3)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>PIXELARENA</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            Create your account. Start earning.
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                placeholder="e.g. KenGameKing"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">M-Pesa Phone Number</label>
              <input
                placeholder="e.g. 0712345678"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required minLength={6}
              />
            </div>
            {error && <div className="form-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}
            <button className="btn btn-neon btn-block" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : '🚀 Create Account'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text2)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}