# Warehouse Management System (MongoDB) - Deployment Ready

## 1. Setup Environment
1. Copy `.env.example` to `.env`
2. Set your MongoDB Atlas URI and JWT_SECRET in `.env`:
```
PORT=3000
JWT_SECRET=rahsiaawak123
MONGO_URI=mongodb+srv://<dbuser>:<dbpassword>@cluster0.mongodb.net/wms_db
```

## 2. Run Locally
```
npm install
npm start
```
Open browser: http://localhost:3000

## 3. GitHub Push (replace <username> with your GitHub username)
```
git init
git add .
git commit -m "Initial commit MongoDB WMS"
git branch -M main
git remote add origin https://github.com/<username>/wms-mongo.git
git push -u origin main
```

## 4. Deploy to Render
1. Go to https://render.com → New → Web Service
2. Choose GitHub repo
3. Build Command: npm install
4. Start Command: npm start
5. Environment Variables:
```
PORT=3000
JWT_SECRET=rahsiaawak123
MONGO_URI=<your_mongodb_connection_string>
```
6. Create → wait for deploy → get URL online

## 5. Deploy to Railway
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select repo
3. Add Environment Variables as above
4. Wait for build → get URL online

## 6. Usage
- Register user: `/api/auth/register` or add manually in MongoDB
- Login dashboard: `/dashboard.html`
- Items CRUD persists in MongoDB Atlas
