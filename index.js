const express = require('express');
const app = express();

// Load data JSON baru
// Pastikan file 'boss.json' berisi data hasil output Python tadi
let rawData = [];
try {
  rawData = require('./boss.json');
} catch (e) {
  console.error("Gagal memuat boss.json. Pastikan file ada dan formatnya benar.");
  rawData = [];
}

// Pre-processing: Tambahkan ID unik berdasarkan index jika tidak ada
// Ini penting agar endpoint /:id tetap bekerja
const monsterData = rawData.map((m, index) => ({
  id: index + 1, // ID dimulai dari 1
  ...m
}));

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Helper: Cek apakah monster valid (punya nama dan statdef)
const getValidMonsters = () => {
  return monsterData.filter(m => m.name && Array.isArray(m.statdef) && m.statdef.length > 0);
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Toram Monster API (Grouped Version)',
    version: '2.0.0',
    structure: 'Hierarchical (Name -> Statdef)',
    endpoints: {
      'GET /api/monsters': 'Ambil semua monster',
      'GET /api/monsters/:id': 'Ambil monster berdasarkan ID',
      'GET /api/monsters/search/:name': 'Cari monster berdasarkan nama',
      'GET /api/monsters/element/:element': 'Filter berdasarkan element (cek semua difficulty)',
      'GET /api/monsters/level/:min/:max': 'Filter berdasarkan level range (cek semua difficulty)',
      'GET /api/stats': 'Statistik total varian boss'
    }
  });
});

// GET semua monster (Paginated)
app.get('/api/monsters', (req, res) => {
  try {
    const validMonsters = getValidMonsters();

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
    const id = parseInt(req.params.id);
    const monster = monsterData.find(m => m.id === id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: 'Monster tidak ditemukan'
      });
    }

    res.json({ success: true, data: monster });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET monster search by NAME
app.get('/api/monsters/search/:name', (req, res) => {
  try {
    const searchTerm = req.params.name.toLowerCase();

    // Cari di properti 'name'
    const results = monsterData.filter(m =>
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

// GET monster by ELEMENT
// Mencari monster yang SALAH SATU varian difficulty-nya memiliki elemen tersebut
app.get('/api/monsters/element/:element', (req, res) => {
  try {
    const elementQuery = req.params.element.toLowerCase();

    const results = monsterData.filter(m => {
      if (!m.statdef) return false;
      // Cek apakah ada statdef yang elemennya cocok
      return m.statdef.some(stat =>
        stat.element && stat.element.toLowerCase().includes(elementQuery)
      );
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET monster by LEVEL RANGE
// Mencari monster yang SALAH SATU varian difficulty-nya masuk range level
app.get('/api/monsters/level/:min/:max', (req, res) => {
  try {
    const min = parseInt(req.params.min);
    const max = parseInt(req.params.max);

    const results = monsterData.filter(m => {
      if (!m.statdef) return false;
      // Cek apakah ada statdef yang levelnya masuk range
      return m.statdef.some(stat => {
        const lvl = parseInt(stat.level);
        return !isNaN(lvl) && lvl >= min && lvl <= max;
      });
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Statistics
app.get('/api/stats', (req, res) => {
  try {
    // Flatten semua statdef untuk hitungan statistik global
    const allVariants = [];
    monsterData.forEach(m => {
      if (m.statdef) {
        m.statdef.forEach(stat => allVariants.push(stat));
      }
    });

    const levels = allVariants.map(v => parseInt(v.level)).filter(l => !isNaN(l));
    const hps = allVariants.map(v => parseInt(v.hp)).filter(h => !isNaN(h));

    const stats = {
      total_unique_bosses: monsterData.length,
      total_difficulty_variants: allVariants.length,
      level: {
        max: Math.max(...levels),
        min: Math.min(...levels),
        avg: levels.length ? (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(2) : 0
      },
      hp: {
        avg: hps.length ? Math.round(hps.reduce((a, b) => a + b, 0) / hps.length) : 0,
        max: Math.max(...hps)
      },
      elements_distribution: {}
    };

    // Hitung distribusi elemen
    allVariants.forEach(v => {
      if (v.element) {
        const el = v.element.trim();
        stats.elements_distribution[el] = (stats.elements_distribution[el] || 0) + 1;
      }
    });

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Export untuk Vercel
module.exports = app;

// Local Development
if (require.main === module) {
  const PORT = process.env.PORT || 2000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
