const express = require('express');
const shortid = require('shortid');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

function authMiddleware(req, res, next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({ message: 'No token' });
  const token = header.split(' ')[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  }catch(e){
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = ({ db }) => {
  const router = express.Router();

  // list items
  router.get('/', authMiddleware, async (req, res) => {
    await db.read();
    res.json(db.data.items || []);
  });

  // create item
  router.post('/', authMiddleware, async (req, res) => {
    await db.read();
    const { name, quantity=0, location='', expiry=null } = req.body;
    const item = { id: shortid.generate(), name, quantity: Number(quantity), location, expiry };
    db.data.items.push(item);
    await db.write();
    res.json(item);
  });

  // update
  router.put('/:id', authMiddleware, async (req, res) => {
    await db.read();
    const item = db.data.items.find(i=>i.id===req.params.id);
    if(!item) return res.status(404).json({ message: 'Not found' });
    const { name, quantity, location, expiry } = req.body;
    if(name!==undefined) item.name = name;
    if(quantity!==undefined) item.quantity = Number(quantity);
    if(location!==undefined) item.location = location;
    if(expiry!==undefined) item.expiry = expiry;
    await db.write();
    res.json(item);
  });

  // delete
  router.delete('/:id', authMiddleware, async (req, res) => {
    await db.read();
    const idx = db.data.items.findIndex(i=>i.id===req.params.id);
    if(idx===-1) return res.status(404).json({ message: 'Not found' });
    const removed = db.data.items.splice(idx,1)[0];
    await db.write();
    res.json(removed);
  });

  return router;
};
