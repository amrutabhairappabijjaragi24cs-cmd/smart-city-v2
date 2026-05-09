# 📱 How to Access SmartCity from Any Device

## Option 1 — Mobile/Other Laptop on Same WiFi (Easiest)

### Step 1: Start the backend
```
cd server
npm install
copy .env.example .env
npm run dev
```

### Step 2: Start the frontend
```
cd client
npm install
npm run dev
```

### Step 3: Check terminal output
When the server starts you'll see:
```
🏙️  SmartCity API started!
   Local:   http://localhost:5000
   Network: http://192.168.1.5:5000   ← YOUR LAPTOP IP

📱 Share this with mobile/other laptops on same WiFi:
   http://192.168.1.5:5000
```

When the frontend starts you'll see:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.5:5173/   ← SHARE THIS LINK
```

### Step 4: Open on mobile
Connect your phone to the SAME WiFi as your laptop.
Open this URL in phone browser:
```
http://192.168.1.5:5173
```
Replace 192.168.1.5 with YOUR laptop's IP shown in terminal.

---

## Option 2 — Deploy Online (Access from Anywhere in World)

### Backend → Render.com (Free)
1. Create account at https://render.com
2. New → Web Service → Connect GitHub repo
3. Root directory: `server`
4. Build: `npm install`
5. Start: `npm start`
6. Add environment variables:
   - MONGODB_URI = your MongoDB Atlas URL
   - JWT_SECRET  = any random string
   - CLIENT_URL  = your Vercel URL (after frontend deploy)
7. Deploy → copy the URL e.g. https://smartcity-api.onrender.com

### Frontend → Vercel (Free)
1. Create account at https://vercel.com
2. New Project → Import GitHub repo
3. Root directory: `client`
4. Framework: Vite
5. Add environment variable:
   - VITE_API_URL = https://smartcity-api.onrender.com
6. Deploy → share the URL with anyone!

### MongoDB → Atlas (Free)
1. Create account at https://mongodb.com/atlas
2. Free cluster → Connect → Get connection string
3. Paste into Render's MONGODB_URI variable

---

## Option 3 — Find your IP manually

### Windows
Open Command Prompt and type:
```
ipconfig
```
Find "IPv4 Address" under your WiFi adapter.

### Firewall Note
If mobile can't connect, Windows Firewall may be blocking.
Allow Node.js through firewall:
1. Search "Windows Firewall" → Allow an app
2. Find Node.js → check both Private and Public boxes
