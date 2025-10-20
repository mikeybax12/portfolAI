# Deployment Guide

## Deploy to GitHub Pages + Railway

### Step 1: Push to GitHub

1. **Open terminal in your project folder**

2. **Initialize git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - PortfolAI"
   ```

3. **Create a new GitHub repository:**
   - Go to https://github.com/new
   - Repository name: `portfolai`
   - Make it Public or Private
   - Do NOT initialize with README (we already have one)
   - Click "Create repository"

4. **Link and push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/portfolai.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy Backend to Railway

1. **Go to https://railway.app and sign in with GitHub**

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `portfolai` repository

3. **Add a PostgreSQL database:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will create a database and give you a `DATABASE_URL`

4. **Add environment variables:**
   - Click on your service
   - Go to "Variables" tab
   - Add these variables:
     ```
     DATABASE_URL=<automatically set by Railway PostgreSQL>
     JWT_SECRET=portfolai-super-secret-jwt-key-2024-change-in-production
     ANTHROPIC_API_KEY=<your_anthropic_api_key_here>
     FINNHUB_API_KEY=<your_finnhub_api_key_here>
     PORT=3001
     ```

5. **Set up database:**
   - Click on your PostgreSQL service
   - Go to "Data" tab
   - Click "Query" and paste the contents of `database.sql`
   - Run the query to create tables

6. **Get your Railway URL:**
   - Click on your service
   - Go to "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://portfolai-production.up.railway.app`)

### Step 3: Update Frontend for Production

1. **Update API URL in app.js:**

   Find this line (around line 4):
   ```javascript
   const API_URL = 'http://localhost:3001/api';
   ```

   Change it to:
   ```javascript
   const API_URL = window.location.hostname === 'localhost'
     ? 'http://localhost:3001/api'
     : 'https://YOUR-RAILWAY-APP.up.railway.app/api';
   ```

   Replace `YOUR-RAILWAY-APP` with your actual Railway URL!

2. **Commit and push changes:**
   ```bash
   git add app.js
   git commit -m "Update API URL for production"
   git push
   ```

### Step 4: Deploy Frontend to GitHub Pages

1. **Go to your GitHub repository settings**

2. **Navigate to Pages:**
   - Settings → Pages (in sidebar)
   - Source: "Deploy from a branch"
   - Branch: Select `main` and `/root`
   - Click "Save"

3. **Wait a few minutes** for GitHub to build and deploy

4. **Access your site at:**
   ```
   https://YOUR_USERNAME.github.io/portfolai/
   ```

### Step 5: Test Your Deployment

1. Visit your GitHub Pages URL
2. Create a test account
3. Add a client
4. Document a meeting (test AI summary)
5. Schedule a meeting
6. Check market data widget

## Troubleshooting

**CORS Error:**
Add to `server.js` around line 28:
```javascript
app.use(cors({
  origin: 'https://YOUR_USERNAME.github.io'
}));
```

**API calls failing:**
- Check Railway logs for errors
- Verify environment variables are set
- Make sure DATABASE_URL is correct

**GitHub Pages 404:**
- Check that repo is public
- Verify Pages is enabled in settings
- Wait 5-10 minutes after enabling

## Costs

- Railway: Free tier (500 hours/month)
- GitHub Pages: Free
- PostgreSQL on Railway: Free tier included
- **Total: $0/month**

## Custom Domain (Optional)

If you want a custom domain instead of `.github.io`:

1. Buy a domain (Namecheap, GoDaddy, etc.)
2. In GitHub repo settings → Pages → Custom domain
3. Add your domain and configure DNS
4. Update Railway CORS settings

---

**You're all set!** 🎉

Your app is now live and accessible to anyone with the link.
