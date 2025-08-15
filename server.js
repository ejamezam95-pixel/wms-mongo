import express from 'express';
import bodyParser from 'body-parser';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// Folder & DB path
const dbFile = './src/db.json';
const dbDir = path.dirname(dbFile);

// Pastikan folder wujud
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// Setup LowDB dengan default data terus
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, {
  users: [{ id: 'admin', username: 'admin', password: '1234' }],
  stock: [
    { id: 'item1', name: 'Item One', quantity: 10 },
    { id: 'item2', name: 'Item Two', quantity: 5 }
  ],
  inbound: [],
  outbound: []
});

await db.read();

// --- Endpoints ---
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.username === username && u.password === password);
  if (user) res.json({ success: true, message: 'Login successful' });
  else res.status(401).json({ success: false, message: 'Invalid username or password' });
});

app.get('/stock', async (req, res) => {
  await db.read();
  res.json(db.data.stock);
});

app.put('/stock/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  await db.read();
  const item = db.data.stock.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.quantity = quantity;
  await db.write();
  res.json(item);
});

app.get('/inbound', async (req, res) => {
  await db.read();
  res.json(db.data.inbound);
});

app.post('/inbound', async (req, res) => {
  const newItem = req.body;
  await db.read();
  db.data.stock.push(newItem);
  db.data.inbound.push(newItem);
  await db.write();
  res.json(newItem);
});

app.get('/outbound', async (req, res) => {
  await db.read();
  res.json(db.data.outbound);
});

app.post('/outbound', async (req, res) => {
  const { id, quantity } = req.body;
  await db.read();
  const item = db.data.stock.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.quantity < quantity) return res.status(400).json({ error: 'Not enough stock' });
  item.quantity -= quantity;
  db.data.outbound.push({ id: item.id, name: item.name, quantity });
  await db.write();
  res.json({ id: item.id, name: item.name, quantity });
});

app.listen(port, () => console.log(`WMS Server running on port ${port}`));
