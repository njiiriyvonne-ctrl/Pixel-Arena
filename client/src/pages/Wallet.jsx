import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Wallet() {
  const { token, API } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [tab, setTab] = useState('deposit')
  const [form, setForm] = useState({ phone: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (icon, msg) => {
    setToast({ icon, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchWallet = async () => {
    try {
      const [w, t] = await Promise.all([
        axios.get(`${API}/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/wallet/transactions`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      setWallet(w.data)
      setTransactions(t.data)
    } catch {}
  }

  useEffect(() => { fetchWallet() }, [])

  const handleDeposit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`${API}/mpesa/deposit`,
        { phone: form.phone, amount: parseFloat(form.amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showToast('📲', res.data.message)
      setForm({ phone: '', amount: '' })
      setTimeout(fetchWallet, 5000)
    } catch (err) {
      showToast('❌', err.response?.data?.error || 'Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`${API}/mpesa/withdraw`,
        { phone: form.phone, amount: parseFloat(form.amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showToast('📤', res.data.message)
      setForm({ phone: '', amount: '' })
      fetchWallet()
    } catch (err) {
      showToast('❌', err.response?.data?.error || 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  const txIcon = (type) => ({ deposit: '📥', withdrawal: '📤', entry_fee: '🎮', winnings: '🏆' }[type] || '💳')
  const txColor = (type) => ({ deposit: 'var(--neon)', withdrawal: 'var(--red)', entry_fee: 'var(--red)', winnings: 'var(--gold)' }[type] || 'var(--text)')
  const txSign = (type) => (['deposit', 'winnings'].includes(type) ? '+' : '-')

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'monospace', marginBottom: '2rem' }}>
          💳 <span style={{ color: 'var(--accent)' }}>Wallet</span>
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* Left */}
          <div>
            {/* Balance card */}
            <div className="card" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, var(--bg2), var(--bg3))' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text3)', marginBottom: '0.75rem' }}>
                Available Balance
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '2.8rem', fontWeight: 700, color: 'var(--neon)', lineHeight: 1 }}>
                KES {wallet ? Number(wallet.balance).toLocaleString() : '...'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
                {[
                  { lbl: 'Total Deposited', val: wallet?.total_deposited || 0, color: 'var(--neon)' },
                  { lbl: 'Total Won', val: wallet?.total_won || 0, color: 'var(--gold)' },
                ].map(({ lbl, val, color }) => (
                  <div key={lbl} style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: '0.2rem' }}>{lbl}</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color }}>KES {Number(val).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* M-Pesa form */}
            <div className="card">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {['deposit', 'withdraw'].map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    background: tab === t ? 'var(--mpesa)' : 'var(--bg3)',
                    color: tab === t ? '#fff' : 'var(--text2)',
                    transition: 'all 0.15s'
                  }}>
                    {t === 'deposit' ? '📥 Deposit' : '📤 Withdraw'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--mpesa)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--mpesa)' }}>M-Pesa</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Powered by Safaricom Daraja</span>
              </div>

              <form onSubmit={tab === 'deposit' ? handleDeposit : handleWithdraw}>
                <div className="form-group">
                  <label className="form-label">M-Pesa Phone Number</label>
                  <input placeholder="e.g. 0712345678" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (KES)</label>
                  <input type="number" placeholder={tab === 'deposit' ? 'Min KES 10' : `Max KES ${wallet?.balance || 0}`}
                    min="10" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                {tab === 'deposit' && (
                  <div style={{
                    background: 'rgba(76,175,80,0.07)', border: '1px solid rgba(76,175,80,0.2)',
                    borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1rem',
                    fontSize: '0.78rem', color: 'var(--text2)'
                  }}>
                    You'll receive an STK push on your phone. Enter your PIN to confirm.
                    <br />Paybill: <strong style={{ color: 'var(--mpesa)' }}>522533</strong> · Acc: <strong style={{ color: 'var(--mpesa)' }}>PIXELARENA</strong>
                  </div>
                )}
                <button className="btn btn-mpesa btn-block" type="submit" disabled={loading}>
                  {loading ? 'Processing...' : tab === 'deposit' ? '📲 Send STK Push' : '📤 Withdraw Now'}
                </button>
              </form>
            </div>
          </div>

          {/* Right — Transactions */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontFamily: 'monospace' }}>
              Transaction History
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 500 }}>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '3rem', fontSize: '0.9rem' }}>
                  No transactions yet
                </div>
              ) : transactions.map(tx => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', background: 'var(--bg3)'
                    }}>{txIcon(tx.type)}</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{tx.description}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                        {new Date(tx.created_at).toLocaleString()}
                        {tx.status === 'pending' && <span style={{ color: 'var(--gold)', marginLeft: '0.5rem' }}>· pending</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: txColor(tx.type) }}>
                    {txSign(tx.type)}KES {Number(tx.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          background: 'var(--bg3)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
          display: 'flex', gap: '0.75rem', alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 999
        }}>
          <span style={{ fontSize: '1.2rem' }}>{toast.icon}</span>
          <span style={{ fontSize: '0.9rem' }}>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}