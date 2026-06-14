# SegmentIQ CRM — Production Deployment Guide

This guide explains how to deploy the **SegmentIQ CRM** application to production using **Vercel** (for the React/Vite frontend), **Render** (for the FastAPI backend), and **Neon** (for the serverless PostgreSQL database).

---

## 1. Setup Neon Postgres Database

1. Go to [Neon.tech](https://neon.tech/) and log in or create an account.
2. Create a new project named `segmentiq`.
3. In the Neon Console, go to the **Dashboard** and copy the **Connection string**. It should look like this:
   ```env
   postgresql://[user]:[password]@[neon-hostname]/neondb?sslmode=require
   ```
4. Keep this connection string handy; you will use it as the `DATABASE_URL` for the backend deployment.

---

## 2. Deploy FastAPI Backend on Render

You can deploy the backend using the Render Blueprint configuration (`render.yaml`) we have created in the root of the project, or manually on Render's Dashboard.

### Option A: Using Render Blueprints (Recommended)
1. Commit and push the workspace changes to your GitHub repository.
2. Log in to [Render](https://render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub repository containing the SegmentIQ project.
5. Render will automatically read the `render.yaml` file and prompt you to input the environment variables:
   - `DATABASE_URL`: Paste your Neon Postgres connection string.
   - `GROQ_API_KEY`: Input your Groq API Key (for Prism AI Workspace).
   - `ALLOWED_ORIGINS`: Paste your Vercel frontend URL once deployed (e.g., `https://segmentiq-crm.vercel.app`).
6. Click **Apply** to deploy the services.

### Option B: Manual Web Service Setup
1. On the Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Name**: `segmentiq-backend`
   - **Language/Runtime**: `Python`
   - **Root Directory**: `backend/crm_api`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Under **Advanced**, click **Add Environment Variable** and add:
   - `DATABASE_URL` = (Your Neon Connection String)
   - `GROQ_API_KEY` = (Your Groq API Key)
   - `REDIS_URL` = `redis://localhost:6379/0` (Optional / fallback)
   - `ALLOWED_ORIGINS` = `https://your-app-name.vercel.app` (Your Vercel URL)
5. Click **Create Web Service**.

---

## 3. Deploy React/Vite Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** and select **Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Vercel will build from this folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://segmentiq-backend.onrender.com`).
6. Click **Deploy**.
7. Vercel will build the frontend and provide you with a production URL (e.g., `https://segmentiq-crm.vercel.app`).

> [!IMPORTANT]
> Once you get your Vercel URL, go back to your **Render Web Service settings** and update the `ALLOWED_ORIGINS` environment variable with your Vercel URL to allow secure API requests!

---

## 4. Troubleshooting & Verification

- **Client-Side Routing on Vercel**: We created a `vercel.json` rewrite file inside the `frontend` directory. If you refresh pages like `/dashboard` or `/customers`, Vercel will correctly rewrite the URL to `index.html` and let React Router handle navigation, avoiding 404 errors.
- **Database Connection**: The backend's `/health/db` endpoint will check the database connection. Once deployed, visit `https://your-backend.onrender.com/health/db` to verify that the API has connected to Neon Postgres successfully.
- **CORS Issues**: If API calls fail due to CORS, make sure the `ALLOWED_ORIGINS` environment variable on Render matches your exact Vercel URL (including `https://` but without a trailing slash).
