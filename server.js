// server.js
import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());

// Untuk dapatkan path folder projek
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File database
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

// Inisialisasi database
await db.read();
db.data ||= { items: [] };

// Route contoh: get all items
app.get('/items', async (req, res) => {
  await db.read();
  res.json(db.data.items);
});

// Route contoh: add item
app.post('/items', async (req, res) => {
  const newItem = req.body;
  db.data.items.push(newItem);
  await db.write();
  res.status(201).json(newItem);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
