const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const { initDB } = require('./config/database');

async function startServer() {
  await initDB();

  const authRoutes = require('./routes/auth');
  const challengeRoutes = require('./routes/challenges');
  const walletRoutes = require('./routes/wallet');
  const mpesaRoutes = require('./routes/mpesa');

  app.use('/api/auth', authRoutes);
  app.use('/api/challenges', challengeRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/mpesa', mpesaRoutes);

  app.get('/', (req, res) => {
    res.json({ message: 'PixelArena API running' });
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_match', (matchId) => {
      socket.join(`match_${matchId}`);
    });

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
        winner: data.winner,
        prize: data.prize
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`PixelArena server running on port ${PORT}`);
  });
}

startServer();