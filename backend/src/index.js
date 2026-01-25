require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Database connection error:', err.stack));

// Routes
const authRoutes = require('./routes/authRoutes');
const cardRoutes = require('./routes/cardRoutes');
const deckRoutes = require('./routes/deckRoutes');
const studyRoutes = require('./routes/studyRoutes');

app.use('/auth', authRoutes);
app.use('/cards', cardRoutes);
app.use('/decks', deckRoutes);
app.use('/study', studyRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Flashcard AI Learner API is running' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
