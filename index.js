// index.js - Vercel Serverless Function
const express = require('express');
const app = express();

// Data monster (hardcoded untuk Vercel deployment)
// Atau bisa fetch dari Supabase jika diperlukan
const monsterData = require('./boss.json');

// Middleware
app.use(express.json());

// CORS untuk akses dari frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Helper function untuk filter valid monsters
const getValidMonsters = () => {
  return monsterData.filter(m => m.level !== null && typeof m.id === 'number');
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Toram Monster API',
    version: '1.0.0',
    endpoints: {
      'GET /api/monsters': 'Ambil semua monster',
      'GET /api/monsters/:id': 'Ambil monster berdasarkan ID',
      'GET /api/monsters/search/:name': 'Cari monster berdasarkan nama',
      'GET /api/monsters/element/:element': 'Filter monster berdasarkan element',
      'GET /api/monsters/level/:min/:max': 'Filter monster berdasarkan level range',
      'GET /api/stats': 'Ambil statistik data monster'
    }
  });
});

// GET semua monster
app.get('/api/monsters', (req, res) => {
  try {
    const validMonsters = getValidMonsters();

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {
      success: true,
      count: validMonsters.length,
      page,
      limit,
      totalPages: Math.ceil(validMonsters.length / limit),
      data: validMonsters.slice(startIndex, endIndex)
    };

    res.json(results);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET monster berdasarkan ID
app.get('/api/monsters/:id', (req, res) => {
  try {
    const monster = monsterData.find(m => m.id === parseInt(req.params.id));

    if (!monster || monster.level === null) {
      return res.status(404).json({
        success: false,
        message: 'Monster tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: monster
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET monster berdasarkan nama (search)
app.get('/api/monsters/search/:name', (req, res) => {
  try {
    const searchTerm = req.params.name.toLowerCase();
    const results = monsterData.filter(m =>
      m.name && m.name.toLowerCase().includes(searchTerm) && m.level !== null
    );

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET monster berdasarkan element
app.get('/api/monsters/element/:element', (req, res) => {
  try {
    const element = req.params.element;
    const validMonsters = getValidMonsters();
    const results = validMonsters.filter(m =>
      m.element && m.element.toLowerCase().includes(element.toLowerCase())
    );

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET monster berdasarkan level range
app.get('/api/monsters/level/:min/:max', (req, res) => {
  try {
    const min = parseInt(req.params.min);
    const max = parseInt(req.params.max);
    const validMonsters = getValidMonsters();

    const results = validMonsters.filter(m =>
      m.level >= min && m.level <= max
    );

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET statistik
app.get('/api/stats', (req, res) => {
  try {
    const validMonsters = getValidMonsters();

    const stats = {
      total_monsters: validMonsters.length,
      avg_level: (validMonsters.reduce((sum, m) => sum + m.level, 0) / validMonsters.length).toFixed(2),
      max_level: Math.max(...validMonsters.map(m => m.level)),
      min_level: Math.min(...validMonsters.map(m => m.level)),
      elements: [...new Set(validMonsters.map(m => m.element).filter(e => e))],
      avg_hp: Math.round(validMonsters.reduce((sum, m) => sum + (m.hp || 0), 0) / validMonsters.length)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Export untuk Vercel
app.listen(2000, () => {
  console.log("A")
})
