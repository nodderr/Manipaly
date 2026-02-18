# Deploying Manipaly for Free on Render

To play with friends, you need to host the game online. **Render** is a great free option that supports both the Node.js backend (for game logic/sockets) and the React frontend.

## 1. Prerequisites
- Ensure your latest code is pushed to GitHub.

## 2. Deploy the Backend (Server)
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`Manipaly`).
4. Configure the service:
   - **Name**: `manipaly-server` (or similar)
   - **Root Directory**: `server`
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Free Instance**: Yes
5. **Environment Variables** (Add these later or now):
   - You will need `CLIENT_URL` once the frontend is deployed. For now, leave it empty or set to `*` to allow anyone to connect (for testing).
6. Click **Create Web Service**.
7. **Copy the Service URL** (e.g., `https://manipaly-server.onrender.com`) once it's live.

## 3. Deploy the Frontend (Client)
1. Go back to the Render Dashboard.
2. Click **New +** -> **Static Site**.
3. Connect the same GitHub repository (`Manipaly`).
4. Configure the site:
   - **Name**: `manipaly-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. **Environment Variables**:
   - Key: `VITE_SERVER_URL`
   - Value: The URL from step 2 (e.g., `https://manipaly-server.onrender.com`). **Important**: No trailing slash.
6. Click **Create Static Site**.
7. **Copy the Site URL** (e.g., `https://manipaly-client.onrender.com`).

## 4. Final Configuration
1. Go back to your **Server** Web Service -> **Environment**.
2. Add/Edit the variable:
   - Key: `CLIENT_URL`
   - Value: The frontend URL from step 3 (e.g., `https://manipaly-client.onrender.com`).
3. Save changes. The server will redeploy automatically.

## 5. Play!
Share the **Frontend URL** with your friends. They can join your lobby and play!

> **Note**: The free tier on Render "spins down" after inactivity. The first time you load the game after a break, it might take 30-60 seconds for the server to wake up.
