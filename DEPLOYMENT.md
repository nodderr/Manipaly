# 🏆 Best Deployment Pipeline for Manipaly

For the best performance and ease of use on the free tier, we recommend a **Hybrid Pipeline**:
- **Frontend**: Hosted on **Vercel** (Global CDN, instant updates, native Single Page App support).
- **Backend**: Hosted on **Render** (Supports persistent Node.js processes and WebSockets, which Vercel Functions do not).

---

## 🚀 Part 1: Deploy Backend (Render)
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`Manipaly`).
4. Configure the service:
   - **Name**: `manipaly-server`
   - **Root Directory**: `server`
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Free Instance**: Yes
5. **Environment Variables** (Add these later or now):
   - You will need `CLIENT_URL` once the frontend is deployed. For now, leave it empty or set to `*` to allow anyone to connect.
6. Click **Create Web Service**.
7. **Copy the Service URL** (e.g., `https://manipaly-server.onrender.com`).

---

## 🚀 Part 2: Deploy Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New** -> **Project**.
3. Import your `Manipaly` repository.
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client` (Click "Edit" next to Root Directory and select `client`)
5. **Environment Variables**:
   - Key: `VITE_SERVER_URL`
   - Value: Your Render Backend URL from Part 1 (e.g., `https://manipaly-server.onrender.com`). **Important**: No trailing slash.
6. Click **Deploy**.
7. **Copy your Vercel Domain** (e.g., `https://manipaly.vercel.app`).

---

## 🚀 Part 3: Connect Them
1. Go back to your **Render Dashboard** -> Server Service -> **Environment**.
2. Add/Edit the variable:
   - Key: `CLIENT_URL`
   - Value: Your Vercel Domain from Part 2 (e.g., `https://manipaly.vercel.app`).
3. Save changes. The server will redeploy automatically.

---

## 🎮 Alternatives

### Alternative A: Everything on Render
You can deploy both Frontend and Backend on Render (Frontend as a Static Site).
- **Pros**: All in one dashboard.
- **Cons**: Slower frontend delivery compared to Vercel's Edge Network.

### Alternative B: GitHub Pages (Frontend)
- **Pros**: Fully integrated with GitHub.
- **Cons**: **Not recommended** because it doesn't support SPA routing natively (refreshing triggers 404s) and requires extra config (`base` URL).

---

> **Note**: The free tier on Render "spins down" after inactivity. The first time you load the game after a break, it might take 30-60 seconds for the server to wake up.
