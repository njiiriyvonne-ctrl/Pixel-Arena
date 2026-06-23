import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'
import axios from 'axios'

export default function Live() {
  const { token, user, API } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [messages, setMessages] = useState([
    { user: 'Arena254', text: 'What a match!! 🔥', time: '10:01 AM' },
    { user: 'NairobiGamer', text: 'KES 1000 on player 1 💰', time: '10:02 AM' },
    { user: 'TopWatcher', text: 'This is insane 🎮', time: '10:03 AM' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [recordedChunks, setRecordedChunks] = useState([])
  const [viewers] = useState(Math.floor(Math.random() * 200) + 50)
  const socketRef = useRef(null)
  const chatRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:5001')
    socketRef.current.emit('join_match', 'lobby')
    socketRef.current.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    axios.get(`${API}/challenges`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setChallenges(res.data.filter(c => c.status === 'live')))

    return () => socketRef.current?.disconnect()
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const sendChat = () => {
    if (!chatInput.trim()) return
    socketRef.current?.emit('chat_message', {
      matchId: 'lobby', user: user?.username || 'You', text: chatInput
    })
    setMessages(prev => [...prev, { user: user?.username || 'You', text: chatInput, time: new Date().toLocaleTimeString() }])
    setChatInput('')
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }, audio: true
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = e => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `match-${Date.now()}.webm`
        a.click()
      }
      recorder.start()
      setMediaRecorder(recorder)
      setRecording(true)
    } catch (err) {
      alert('Screen recording requires permission. Please allow screen share.')
    }
  }

  const stopRecording = () => {
    mediaRecorder?.stop()
    setRecording(false)
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
  }

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'monospace' }}>
            🔴 <span style={{ color: 'var(--accent)' }}>Live</span> Matches
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Screen recorded & broadcast in real time
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>

          {/* Stream */}
          <div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1rem' }}>
              {/* Preview */}
              <div style={{
                position: 'relative', aspectRatio: '16/9',
                background: 'linear-gradient(135deg, #0A0A1A, #1A0A2E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <video ref={videoRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: recording ? 'block' : 'none' }} muted />
                {!recording && (
                  <>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(124,92,255,0.2) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(0,255,179,0.1) 0%, transparent 50%)' }} />
                    <div style={{ fontSize: '4rem', position: 'relative', zIndex: 1, opacity: 0.2 }}>🎮</div>
                  </>
                )}
                <div style={{
                  position: 'absolute', top: '1rem', left: '1rem',
                  background: recording ? 'var(--red)' : 'rgba(0,0,0,0.6)',
                  color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '100px',
                  fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem'
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: recording ? '#fff' : 'var(--red)', animation: recording ? 'pulse 1s infinite' : 'none' }} />
                  {recording ? 'RECORDING' : 'PREVIEW'}
                </div>
                <div style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'rgba(0,0,0,0.6)', color: 'var(--text)',
                  padding: '0.3rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem'
                }}>👁 {viewers} watching</div>
              </div>

              {/* Controls */}
              <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>
                    {challenges.length > 0 ? challenges[0].title : 'No live matches yet'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                    {challenges.length > 0 ? `${challenges[0].game} · KES ${Number(challenges[0].entry_fee).toLocaleString()} entry` : 'Waiting for matches to go live...'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!recording ? (
                    <button className="btn btn-danger" onClick={startRecording} style={{ fontSize: '0.8rem' }}>
                      ⏺ Start Recording
                    </button>
                  ) : (
                    <button className="btn btn-ghost" onClick={stopRecording} style={{ fontSize: '0.8rem' }}>
                      ⏹ Stop & Save
                    </button>
                  )}
                  <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
                    onClick={() => navigator.clipboard.writeText(window.location.href)}>
                    🔗 Share
                  </button>
                </div>
              </div>
            </div>

            {/* Live challenges list */}
            {challenges.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 600 }}>
                  All Live Matches
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {challenges.slice(0, 4).map(c => (
                    <div key={c.id} className="card" style={{ padding: '0.85rem', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{c.game} · KES {Number(c.entry_fee).toLocaleString()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--red)' }}>LIVE</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          <div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem' }}>
                💬 Live Chat
              </div>
              <div ref={chatRef} style={{ height: 380, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                    <span style={{
                      fontWeight: 600, marginRight: '0.35rem',
                      color: m.user === user?.username ? 'var(--gold)' : `hsl(${m.user.length * 40}, 70%, 65%)`
                    }}>{m.user}</span>
                    <span style={{ color: 'var(--text2)' }}>{m.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <input
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                  placeholder="Say something..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                />
                <button className="btn btn-primary" onClick={sendChat} style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>
    </div>
  )
}