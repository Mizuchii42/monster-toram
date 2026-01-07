const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 2500;

// Middleware
app.use(express.json());

// Baca data dari file JSON
const getMonsterData = () => {
  const data = fs.readFileSync('toram_data_complete.json', 'utf-8');
  return JSON.parse(data);
};

// GET semua monster
app.get('/api/monsters', (req, res) => {
  try {
    const monsters = getMonsterData();
    // Filter data yang valid (ada level)
    const validMonsters = monsters.filter(m => m.level !== null && typeof m.id === 'number');
    res.json({
      success: true,
      count: validMonsters.length,
      data: validMonsters
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET monster berdasarkan ID
app.get('/api/monsters/:id', (req, res) => {
  try {
    const monsters = getMonsterData();
    const monster = monsters.find(m => m.id === parseInt(req.params.id));

    if (!monster) {
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
    const monsters = getMonsterData();
    const searchTerm = req.params.name.toLowerCase();
    const results = monsters.filter(m =>
      m.name && m.name.toLowerCase().includes(searchTerm)
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
    const monsters = getMonsterData();
    const element = req.params.element;
    const results = monsters.filter(m =>
      m.element && m.element.includes(element)
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
    const monsters = getMonsterData();
    const min = parseInt(req.params.min);
    const max = parseInt(req.params.max);

    const results = monsters.filter(m =>
      m.level && m.level >= min && m.level <= max
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
    const monsters = getMonsterData();
    const validMonsters = monsters.filter(m => m.level !== null);

    const stats = {
      total_monsters: validMonsters.length,
      avg_level: (validMonsters.reduce((sum, m) => sum + m.level, 0) / validMonsters.length).toFixed(2),
      max_level: Math.max(...validMonsters.map(m => m.level)),
      min_level: Math.min(...validMonsters.map(m => m.level)),
      elements: [...new Set(validMonsters.map(m => m.element).filter(e => e))]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

// Start server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}`);
});
