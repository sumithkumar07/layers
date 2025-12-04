# Layers: The Trust OS for the Internet

Layers is a decentralized verification system that validates information (text, images) using AI and cryptographic proofs.

## 🚀 Quick Start (Docker)

The easiest way to run the full stack (Backend + Frontend):

```bash
docker-compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

## 📂 Project Structure

- `src/` - Python Backend (FastAPI)
  - `api/` - API Routes & Auth
  - `inference_engine.py` - AI Truth Engine
  - `memory_engine.py` - Vector Database Logic
- `trust-os-web/` - Next.js Frontend
- `packages/` - Python SDK (`layers-sdk`)
- `database/` - SQL Schema & Migrations
  - `schema.sql` - **Master Database Schema** (Run this in Supabase)

## 🛠️ Manual Setup

### Backend
```bash
pip install -r requirements.txt
uvicorn src.api.main:app --reload
```

### Frontend
```bash
cd trust-os-web
npm install
npm run dev
```

## 🔑 Environment Variables
Ensure you have `.env` (backend) and `trust-os-web/.env.local` (frontend) set up with your Supabase credentials.
