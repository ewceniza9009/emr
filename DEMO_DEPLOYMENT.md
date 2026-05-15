# 🚀 Halkyone Demo: Free Deployment Guide

This guide explains how to deploy the Halkyone Clinical OS for **free** for demonstration purposes using a modern, scalable stack.

## 🛠️ The "Free Demo" Stack
- **Frontend**: [Vercel](https://vercel.com) (Next.js)
- **Backend**: [Render](https://render.com) (Docker Container)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)

---

## 1. Database Setup (Supabase)
1. Create a free project on [Supabase](https://supabase.com).
2. Go to **Project Settings > Database**.
3. Copy the **Connection String** (URI). It should look like:
   `postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres`
4. **Important**: Ensure "IPv4" is enabled or use the connection string provided for your environment.

---

## 2. Backend Deployment (Render)
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Select **Docker** as the environment.
4. Set the **Dockerfile Path** to `emr-server/Dockerfile`.
5. Set the following **Environment Variables**:
   - `ConnectionStrings__DefaultConnection`: (The Supabase connection string from Step 1)
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `Jwt__Key`: (A long secure string, e.g., from `CREDENTIALS.md`)
   - `EMR_SEED_DB`: `true` (Only for the first run to seed demo data)
6. Render will automatically build and deploy your container. Note the URL (e.g., `https://halkyone-api.onrender.com`).

---

## 3. Frontend Deployment (Vercel)
1. Go to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Select the `emr-client` folder as the **Root Directory**.
4. Set the following **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: (Your Render URL, e.g., `https://halkyone-api.onrender.com`)
   - `NEXT_PUBLIC_GRAPHQL_URL`: `https://[YOUR_RENDER_URL]/graphql`
   - `NEXT_PUBLIC_GRAPHQL_WS_URL`: `wss://[YOUR_RENDER_URL]/graphql`
   - `NEXTAUTH_URL`: (Your Vercel URL, or leave blank for auto-detection)
   - `NEXTAUTH_SECRET`: (A secure string)
5. Click **Deploy**.

---

## 🔗 Continuous Delivery (CD)
The project is already configured with GitHub Actions (`.github/workflows/ci.yml`).
- Every push to `main` builds and pushes a Docker image to **GitHub Container Registry (GHCR)**.
- To automate Render redeploys:
  1. In Render, go to your service's **Settings**.
  2. Copy the **Deploy Hook** URL.
  3. Add it as a Secret in GitHub (`RENDER_DEPLOY_HOOK`).
  4. Uncomment the `curl` line in `.github/workflows/ci.yml`.

---

## 📝 Post-Deployment
- The first deploy might take a few minutes as Render builds the Docker image.
- Since it's a free tier, the backend will "sleep" after inactivity. The first request after a break might be slow (30s+).
- Use the credentials in `CREDENTIALS.md` to log in once deployed!
