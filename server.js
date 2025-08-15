import express from 'express';
import bodyParser from 'body-parser';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// --- LowDB setup ---
const dbFile = './src/db.json'; // pastikan path db.json betul
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

// --- Default data ---
await db.read();
db.data ||= { 
    users: [
        { id: 'admin', username: 'admin', password: '1234' } // login boleh guna
    ],
    stock: [
        { id: 'item1', name: 'Item One', quantity: 10 },
        { id: 'item2', name: 'Item Two', quantity: 5 }
    ],
    inbound: [],
    outbound: []
};
await db.write(); // simpan default data jika kosong

// --- Login endpoint ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    await db.read();
    const user = db.data.users.find(u => u.username === username && u.password === password);
    if (user) res.json({ success: true, message: 'Login successful' });
    else res.status(401).json({ success: false, message: 'Invalid username or password' });
});

// --- Stock endpoints ---
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

// --- Inbound endpoints ---
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

// --- Outbound endpoints ---
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

// --- Start server ---
app.listen(port, () => console.log(`WMS Server running on port ${port}`));
