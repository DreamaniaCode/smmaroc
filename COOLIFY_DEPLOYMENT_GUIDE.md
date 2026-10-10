# 🚀 Deploying SMM Agency Panel to Coolify Cloud

This project is pre-configured for seamless 1-click deployment on **Coolify** using Docker Compose.

---

## 1. Prerequisites on Your Coolify Instance
* A running Coolify instance on your VPS (Ubuntu/Debian).
* A domain or subdomain pointed to your VPS (e.g. `smm.youragency.com`).

---

## 2. Deploy via Coolify (Git Repository Method)

1. **Push this codebase to GitHub or GitLab:**
   ```bash
   git add .
   git commit -m "Initial commit of SMM Agency Operations Hub"
   git remote add origin https://github.com/your-username/smm-panel.git
   git push -u origin main
   ```

2. **In Coolify Dashboard:**
   * Click **+ New Resource** → **Application** → **Public/Private Repository**.
   * Select your repository and branch (`main`).
   * For **Build Pack**, select: **Docker Compose**.
   * Coolify will automatically detect `docker-compose.yml`.

3. **Configure Environment Variables in Coolify:**
   In the Application's **Environment Variables** tab, add:
   ```env
   NODE_ENV=production
   JWT_SECRET=generate-a-random-32-character-secret-key-here
   ADMIN_INITIAL_EMAIL=admin@youragency.com
   ADMIN_INITIAL_PASSWORD=YourSecurePassword123!
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNO...
   TELEGRAM_CHAT_ID=987654321
   ```

4. **Point Your Domain & Enable SSL:**
   * Under **Configuration** → **Domains**, enter: `https://smm.youragency.com`.
   * Coolify will automatically generate a free **Let's Encrypt SSL certificate** and route HTTPS traffic to port `3000`.

5. **Click "Deploy"!**
   * Coolify will build both the **Web Dashboard** and the **Autonomous Background Worker**.
   * Persistent database volume `smm_data` guarantees your order history, client tags, and settings survive redeploys and reboots.

---

## 3. Post-Deployment Verification
* Open your domain in the browser (e.g., `https://smm.youragency.com`).
* Log in with your `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD`.
* Navigate to **Providers & APIs** to add your upstream provider API keys.
* Navigate to **Services & Routing** to configure your primary and backup failover services.
* Go to **Settings & Automations** and click **Send Test Alert** to verify Telegram connectivity.
