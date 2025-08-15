const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { Low, JSONFile } = require('lowdb');
const shortid = require('shortid');

// Setup lowdb
const dbFile = process.env.LOWDB_FILE || './db.json';
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

async function initDb(){
  await db.read();
  db.data = db.data || { users: [], items: [] };
  // seed default admin if not present
  if(!db.data.users.find(u=>u.username==='admin')){
    const bcrypt = require('bcrypt');
    const pw = bcrypt.hashSync('admin123', 10);
    db.data.users.push({ id: shortid.generate(), username:'admin', password: pw, role: 'admin' });
    await db.write();
    console.log('Seeded admin / password: admin123');
  }
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// simple auth & routes
const authRouter = require('./routes/auth');
const itemsRouter = require('./routes/items');

app.use('/api/auth', authRouter({ db }));
app.use('/api/items', itemsRouter({ db }));

const PORT = process.env.PORT || 3000;
initDb().then(()=>{
  app.listen(PORT, ()=> console.log('Server running on port', PORT));
}).catch(err => console.error(err));
