import express from 'express';
import { Low, JSONFile } from 'lowdb';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { users: [], stock: [], inbound: [], outbound: [] });

await db.read();
db.data ||= { users: [], stock: [], inbound: [], outbound: [] };

// ====================
// ROOT ROUTE
// ====================
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to Warehouse Management System (WMS) API!</h1>
    <p>Available endpoints:</p>
    <ul>
      <li>POST /login</li>
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
// LOGIN ROUTE
// ====================
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.username === username && u.password === password);
  if (user) return res.json({ success: true, message: 'Login successful' });
  res.status(401).json({ success: false, message: 'Invalid username or password' });
});

// ====================
// INBOUND ROUTES
// ====================
app.get('/inbound', async (req, res) => {
  await db.read();
  res.json(db.data.inbound);
});

app.post('/inbound', async (req, res) => {
  const newInbound = req.body;
  db.data.inbound.push(newInbound);

  const existingStock = db.data.stock.find(item => item.id === newInbound.id);
  if (existingStock) existingStock.quantity += newInbound.quantity;
  else db.data.stock.push({ ...newInbound });

  await db.write();
  res.status(201).json(newInbound);
});

// ====================
// STOCK ROUTES
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
  if (!stockItem) return res.status(404).json({ error: 'Item not found' });

  stockItem.quantity = quantity;
  await db.write();
  res.json(stockItem);
});

// ====================
// OUTBOUND ROUTES
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
    return res.status(400).json({ error: 'Not enough stock' });
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
  console.log(`WMS Server with Login running on port ${PORT}`);
});
