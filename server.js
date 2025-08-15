// server.js
import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup database
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { stock: [], inbound: [], outbound: [] }); // default data

await db.read();
db.data ||= { stock: [], inbound: [], outbound: [] };

// ====================
// ROOT ROUTE
// ====================
app.get('/', (req, res) => {
  res.send(`
    <h1>Selamat datang ke Warehouse Management System (WMS) API!</h1>
    <p>Senarai endpoint tersedia:</p>
    <ul>
      <li>GET /stock</li>
      <li>PUT /stock/:id</li>
      <li>GET /inbound</li>
      <li>POST /inbound</li>
      <li>GET /outbound</li>
      <li>POST /outbound</li>
    </ul>
  `);
});

// ====================
// ROUTE INBOUND
// ====================
app.get('/inbound', async (req, res) => {
  await db.read();
  res.json(db.data.inbound);
});

app.post('/inbound', async (req, res) => {
  const newInbound = req.body;
  db.data.inbound.push(newInbound);

  // Update stok automatik
  const existingStock = db.data.stock.find(item => item.id === newInbound.id);
  if (existingStock) {
    existingStock.quantity += newInbound.quantity;
  } else {
    db.data.stock.push({ ...newInbound });
  }

  await db.write();
  res.status(201).json(newInbound);
});

// ====================
// ROUTE STOCK
// ====================
app.get('/stock', async (req, res) => {
  await db.read();
  res.json(db.data.stock);
});

app.put('/stock/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  await db.read();

  const stockItem = db.data.stock.find(item => item.id === id);
  if (!stockItem) return res.status(404).json({ error: 'Item tidak ditemui' });

  stockItem.quantity = quantity;
  await db.write();
  res.json(stockItem);
});

// ====================
// ROUTE OUTBOUND
// ====================
app.get('/outbound', async (req, res) => {
  await db.read();
  res.json(db.data.outbound);
});

app.post('/outbound', async (req, res) => {
  const newOutbound = req.body;
  await db.read();

  const stockItem = db.data.stock.find(item => item.id === newOutbound.id);
  if (!stockItem || stockItem.quantity < newOutbound.quantity) {
    return res.status(400).json({ error: 'Stok tidak mencukupi' });
  }

  stockItem.quantity -= newOutbound.quantity;
  db.data.outbound.push(newOutbound);

  await db.write();
  res.status(201).json(newOutbound);
});

// ====================
// START SERVER
// ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server WMS berjalan di port ${PORT}`);
});
