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
// INBOUND ROUTES
// ====================

// Get all inbound records
app.get('/inbound', async (req, res) => {
  await db.read();
  res.json(db.data.inbound);
});

// Add new inbound record
app.post('/inbound', async (req, res) => {
  const newInbound = req.body;
  db.data.inbound.push(newInbound);

  // Update stock automatically
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
// STOCK ROUTES
// ====================

// Get all stock
app.get('/stock', async (req, res) => {
  await db.read();
  res.json(db.data.stock);
});

// Update stock quantity manually
app.put('/stock/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  await db.read();
  const stockItem = db.data.stock.find(item => item.id === id);
  if (!stockItem) return res.status(404).json({ error: 'Item not found' });

  stockItem.quantity = quantity;
  await db.write();
  res.json(stockItem);
});

// ====================
// OUTBOUND ROUTES
// ====================

// Get all outbound records
app.get('/outbound', async (req, res) => {
  await db.read();
  res.json(db.data.outbound);
});

// Add outbound record (reduce stock)
app.post('/outbound', async (req, res) => {
  const newOutbound = req.body;
  await db.read();

  const stockItem = db.data.stock.find(item => item.id === newOutbound.id);
  if (!stockItem || stockItem.quantity < newOutbound.quantity) {
    return res.status(400).json({ error: 'Not enough stock' });
  }

  stockItem.quantity -= newOutbound.quantity;
  db.data.outbound.push(newOutbound);

  await db.write();
  res.status(201).json(newOutbound);
});

// ====================
// SERVER
// ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WMS Server running on port ${PORT}`);
});
