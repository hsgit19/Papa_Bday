const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI environment variable is not set!');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));

let db;

async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('papa_birthday');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Papa Birthday Backend Running ⚙️', db: db ? 'connected' : 'disconnected' });
});

// ── WISHES ──
app.get('/wishes', async (req, res) => {
  try {
    const wishes = await db.collection('wishes').find({}).sort({ createdAt: -1 }).toArray();
    res.json(wishes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/wishes', async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!name || !text) return res.status(400).json({ error: 'Name and text required' });
    const wish = {
      name: name.trim().substring(0, 60),
      text: text.trim().substring(0, 500),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: new Date()
    };
    const result = await db.collection('wishes').insertOne(wish);
    res.json({ ...wish, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PHOTOS ──
app.get('/photos', async (req, res) => {
  try {
    const photos = await db.collection('photos').find({}).sort({ createdAt: -1 }).toArray();
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/photos', async (req, res) => {
  try {
    const { uploader, src, date } = req.body;
    if (!uploader || !src) return res.status(400).json({ error: 'Uploader and src required' });
    const photo = {
      uploader: uploader.trim().substring(0, 40),
      src,
      date: date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: new Date()
    };
    const result = await db.collection('photos').insertOne(photo);
    res.json({ ...photo, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
