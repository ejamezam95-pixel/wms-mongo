const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const shortid = require('shortid');

module.exports = ({ db }) => {
  const router = express.Router();

  const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

  // login
  router.post('/login', async (req, res) => {
    await db.read();
    const { username, password } = req.body;
    const user = db.data.users.find(u => u.username === username);
    if(!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  // register (admin-only in real apps; this is demo)
  router.post('/register', async (req, res) => {
    await db.read();
    const { username, password } = req.body;
    if(db.data.users.find(u=>u.username===username)) return res.status(400).json({ message: 'User exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: shortid.generate(), username, password: hashed, role: 'staff' };
    db.data.users.push(user);
    await db.write();
    res.json({ message: 'User created', user: { id: user.id, username: user.username } });
  });

  return router;
};
