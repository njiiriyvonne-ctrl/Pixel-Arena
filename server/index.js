const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── CORS — must be before everything ────────────
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());

// ─── SOCKET.IO ────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ─── DATABASE ─────────────────────────────────────
const { db } = require('./config/database');

// ─── AUTH ROUTES ──────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password || !phone) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const existsEmail = db.get('users').find({ email }).value();
  if (existsEmail) return res.status(400).json({ error: 'Email already registered' });

  const existsUsername = db.get('users').find({ username }).value();
  if (existsUsername) return res.status(400).json({ error: 'Username already taken' });

  const meta = db.get('meta').value();
  const id = meta.lastUserId + 1;
  db.get('meta').assign({ lastUserId: id }).write();

  const hashed = bcrypt.hashSync(password, 10);
  const user = {
    id, username, email,
    password: hashed, phone,
    elo: 1200, wins: 0, losses: 0,
    created_at: new Date().toISOString()
  };
  db.get('users').push(user).write();

  const wid = meta.lastWalletId + 1;
  db.get('meta').assign({ lastWalletId: wid }).write();
  db.get('wallets').push({
    id: wid, user_id: id,
    balance: 0, total_deposited: 0,
    total_withdrawn: 0, total_won: 0
  }).write();

  const token = jwt.sign({ id, username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  console.log(`✅ Registered: ${username}`);
  res.json({ token, user: { id, username, email, phone, elo: 1200 } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.get('users').find({ email }).value();
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  console.log(`✅ Login: ${user.username}`);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, phone: user.phone, elo: user.elo, wins: user.wins, losses: user.losses } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safe } = user;
  res.json(safe);
});

// ─── MIDDLEWARE ───────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── WALLET ROUTES ────────────────────────────────
app.get('/api/wallet', authMiddleware, (req, res) => {
  const wallet = db.get('wallets').find({ user_id: req.user.id }).value();
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
  res.json(wallet);
});

app.get('/api/wallet/transactions', authMiddleware, (req, res) => {
  const txs = db.get('transactions').filter({ user_id: req.user.id }).value();
  res.json([...txs].reverse().slice(0, 30));
});

// ─── CHALLENGE ROUTES ─────────────────────────────
app.get('/api/challenges', authMiddleware, (req, res) => {
  const challenges = db.get('challenges')
    .filter(c => c.status === 'open' || c.status === 'live')
    .value();
  const enriched = challenges.map(c => {
    const creator = db.get('users').find({ id: c.creator_id }).value();
    return { ...c, creator_name: creator?.username, creator_elo: creator?.elo };
  });
  res.json([...enriched].reverse());
});

app.post('/api/challenges/create', authMiddleware, (req, res) => {
  const { game, title, rules, entry_fee } = req.body;
  if (!game || !title || !entry_fee) {
    return res.status(400).json({ error: 'Game, title and entry fee required' });
  }

  const wallet = db.get('wallets').find({ user_id: req.user.id }).value();
  if (!wallet || wallet.balance < entry_fee) {
    return res.status(400).json({ error: 'Insufficient balance. Please deposit first.' });
  }

  db.get('wallets').find({ user_id: req.user.id })
    .assign({ balance: wallet.balance - entry_fee }).write();

  const meta = db.get('meta').value();
  const id = meta.lastChallengeId + 1;
  db.get('meta').assign({ lastChallengeId: id }).write();

  const tid = meta.lastTransactionId + 1;
  db.get('meta').assign({ lastTransactionId: tid }).write();
  db.get('transactions').push({
    id: tid, user_id: req.user.id,
    type: 'entry_fee', amount: entry_fee,
    description: `Entry fee: ${title}`,
    status: 'completed',
    created_at: new Date().toISOString()
  }).write();

  const challenge = {
    id, creator_id: req.user.id,
    opponent_id: null, game, title,
    rules: rules || '', entry_fee,
    prize_pool: entry_fee * 1.8,
    status: 'open', winner_id: null,
    created_at: new Date().toISOString()
  };
  db.get('challenges').push(challenge).write();
  console.log(`✅ Challenge created: ${title}`);
  res.json({ message: 'Challenge created!', challengeId: id });
});

app.post('/api/challenges/join/:id', authMiddleware, (req, res) => {
  const challengeId = parseInt(req.params.id);
  const challenge = db.get('challenges').find({ id: challengeId }).value();

  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
  if (challenge.status !== 'open') return res.status(400).json({ error: 'Challenge not open' });
  if (challenge.creator_id === req.user.id) return res.status(400).json({ error: 'Cannot join your own challenge' });

  const wallet = db.get('wallets').find({ user_id: req.user.id }).value();
  if (!wallet || wallet.balance < challenge.entry_fee) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  db.get('wallets').find({ user_id: req.user.id })
    .assign({ balance: wallet.balance - challenge.entry_fee }).write();
  db.get('challenges').find({ id: challengeId })
    .assign({ opponent_id: req.user.id, status: 'live', prize_pool: challenge.entry_fee * 2 * 0.9 }).write();

  const meta = db.get('meta').value();
  const tid = meta.lastTransactionId + 1;
  db.get('meta').assign({ lastTransactionId: tid }).write();
  db.get('transactions').push({
    id: tid, user_id: req.user.id,
    type: 'entry_fee', amount: challenge.entry_fee,
    description: `Joined: ${challenge.title}`,
    status: 'completed',
    created_at: new Date().toISOString()
  }).write();

  res.json({ message: 'Joined! Match is now live.' });
});

app.get('/api/challenges/leaderboard', authMiddleware, (req, res) => {
  const users = db.get('users').value();
  const wallets = db.get('wallets').value();
  const leaders = users.map(u => {
    const wallet = wallets.find(w => w.user_id === u.id);
    return {
      id: u.id, username: u.username,
      elo: u.elo, wins: u.wins, losses: u.losses,
      win_rate: u.wins + u.losses > 0
        ? Math.round(u.wins / (u.wins + u.losses) * 100) : 0,
      total_won: wallet?.total_won || 0
    };
  }).sort((a, b) => b.elo - a.elo).slice(0, 20);
  res.json(leaders);
});

// ─── MPESA ROUTES ─────────────────────────────────
const mpesaRoutes = require('./routes/mpesa');
app.use('/api/mpesa', mpesaRoutes);

// ─── HEALTH CHECK ─────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🚀 PixelArena API running' });
});

// ─── SOCKET.IO EVENTS ─────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join_match', (matchId) => socket.join(`match_${matchId}`));

  socket.on('chat_message', (data) => {
    io.to(`match_${data.matchId}`).emit('receive_message', {
      user: data.user,
      text: data.text,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('score_update', (data) => {
    io.to(`match_${data.matchId}`).emit('score_changed', {
      player1Score: data.player1Score,
      player2Score: data.player2Score
    });
  });

  socket.on('match_ended', (data) => {
    io.to(`match_${data.matchId}`).emit('match_result', {
      winner: data.winner, prize: data.prize
    });
  });

  socket.on('disconnect', () => console.log('❌ Disconnected:', socket.id));
});

// ─── START SERVER ─────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 PixelArena server running on port ${PORT}`);
});