require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token.' });
  }
};

// ============= AUTH ROUTES =============

// Signup
app.post('/api/auth/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, fullName } = req.body;

  try {
    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
      [email, passwordHash, fullName]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// Login
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============= CLIENT ROUTES =============

// Get all clients for logged-in user
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create client
app.post('/api/clients', authenticateToken, [
  body('name').trim().notEmpty(),
  body('phone').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, phone } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO clients (user_id, name, phone) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, name, phone || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update client
app.put('/api/clients/:id', authenticateToken, [
  body('name').trim().notEmpty(),
  body('phone').optional()
], async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  try {
    // Check if client belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const result = await pool.query(
      'UPDATE clients SET name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, phone || null, id, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete client
app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    res.json({ message: 'Client deleted successfully.' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============= MEETING ROUTES =============

// Get all meetings for a client
app.get('/api/clients/:clientId/meetings', authenticateToken, async (req, res) => {
  const { clientId } = req.params;

  try {
    // Verify client belongs to user
    const clientCheck = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, req.userId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const result = await pool.query(
      'SELECT * FROM meetings WHERE client_id = $1 ORDER BY date DESC',
      [clientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create meeting
app.post('/api/clients/:clientId/meetings', authenticateToken, [
  body('date').isDate(),
  body('notes').trim().notEmpty(),
  body('summary').optional(),
  body('sentiment').optional()
], async (req, res) => {
  const { clientId } = req.params;
  const { date, notes, summary, sentiment } = req.body;

  try {
    // Verify client belongs to user
    const clientCheck = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, req.userId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const result = await pool.query(
      'INSERT INTO meetings (client_id, date, notes, summary, sentiment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [clientId, date, notes, summary || null, sentiment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============= SCHEDULED MEETING ROUTES =============

// Get all scheduled meetings for a client
app.get('/api/clients/:clientId/scheduled-meetings', authenticateToken, async (req, res) => {
  const { clientId } = req.params;

  try {
    // Verify client belongs to user
    const clientCheck = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, req.userId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const result = await pool.query(
      'SELECT * FROM scheduled_meetings WHERE client_id = $1 ORDER BY date, time',
      [clientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get scheduled meetings error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create scheduled meeting
app.post('/api/clients/:clientId/scheduled-meetings', authenticateToken, [
  body('date').isDate(),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
  const { clientId } = req.params;
  const { date, time } = req.body;

  try {
    // Verify client belongs to user
    const clientCheck = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, req.userId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const result = await pool.query(
      'INSERT INTO scheduled_meetings (client_id, date, time) VALUES ($1, $2, $3) RETURNING *',
      [clientId, date, time]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create scheduled meeting error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============= STOCK MARKET ROUTES =============

// Get stock quote
app.get('/api/stocks/:symbol', async (req, res) => {
  const { symbol } = req.params;

  try {
    const apiKey = process.env.FINNHUB_API_KEY || '';

    if (!apiKey) {
      // If no API key, return mock data
      const basePrice = {
        'SPY': 450,
        'QQQ': 380,
        'DIA': 350,
        'IWM': 195
      }[symbol] || 100;

      const randomChange = (Math.random() - 0.5) * 10;
      const price = basePrice + randomChange;
      const change = randomChange;
      const changePercent = (randomChange / basePrice) * 100;

      return res.json({
        price,
        change,
        changePercent
      });
    }

    // Fetch real data from Finnhub
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);

    if (!response.ok) {
      throw new Error('Failed to fetch stock data');
    }

    const data = await response.json();

    // Finnhub returns: c (current price), d (change), dp (percent change)
    res.json({
      price: data.c || 0,
      change: data.d || 0,
      changePercent: data.dp || 0
    });
  } catch (error) {
    console.error('Stock API error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// ============= AI / CLAUDE ROUTES =============

// Proxy endpoint for Anthropic API
app.post('/api/claude', authenticateToken, async (req, res) => {
  console.log('Claude endpoint hit! Request body:', req.body);

  // Check if API key is set
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set in environment variables');
    return res.status(500).json({
      error: {
        type: 'configuration_error',
        message: 'ANTHROPIC_API_KEY is not configured on the server'
      }
    });
  }

  try {
    console.log('Making request to Anthropic API...');
    console.log('API Key present:', process.env.ANTHROPIC_API_KEY ? 'Yes (length: ' + process.env.ANTHROPIC_API_KEY.length + ')' : 'No');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    console.log('Anthropic API response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json(error);
    }

    const data = await response.json();
    console.log('Anthropic API success! Response structure:', JSON.stringify({
      hasContent: !!data.content,
      contentLength: data.content?.length,
      firstContentType: data.content?.[0]?.type
    }));
    res.json(data);
  } catch (error) {
    console.error('Claude endpoint error:', error);
    res.status(500).json({ error: { message: 'Internal server error', details: error.message } });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Setup database tables (run once)
app.get('/api/setup-database', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        notes TEXT NOT NULL,
        summary TEXT,
        sentiment VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scheduled_meetings (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
      CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_client_id ON scheduled_meetings(client_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
      CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_date ON scheduled_meetings(date);
    `);

    res.json({ status: 'success', message: 'Database tables created successfully!' });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Catch-all for debugging
app.use((req, res) => {
  console.log('Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Ready to handle authentication and API requests');
});
