# Psoriasis Detection App

This is a full-stack AI web application consisting of a FastAPI backend and a React (Vite) frontend. The system relies on a PyTorch computer vision model to predict whether a provided skin image indicates signs of psoriasis.

## Workspace Structure
- `/backend`: The FastAPI server containing the neural network architecture definition and preprocessing logic to serve `/predict`.
- `/frontend`: The Vite/React application featuring a responsive and accessible user interface built with Tailwind CSS.
- `model.pth`: The original serialized PyTorch model binary.

---

## 🚀 Local Development Setup

### 1. Backend Setting up
You need Python 3.9+ to be installed.
```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
*The API will be available at `http://localhost:8000`. You can view the swagger UI documentation at `http://localhost:8000/docs`.*

### 2. Frontend Setting up
You need Node.js installed.
```bash
cd frontend
npm install
npm run dev
```
*The app will be accessible at `http://localhost:5173`.*

---

## ☁️ Deployment Instructions

### Deploying the Backend (Render)
1. Commit this entire repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Use the following settings:
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Since we only need the CPU for inference, the default free tier or basic tiers in Render work perfectly.

*(Note: If `model.pth` is larger than GitHub's 100MB file limit, you may need to use Git LFS or download the model file as part of your build script on Render.)*

### Deploying the Frontend (Vercel)
1. Sign in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Connect your GitHub repository.
3. Select the `frontend` folder as the root directory.
4. The Build and Output settings should be auto-detected for Vite (`npm run build`, `dist`).
5. **IMPORTANT**: You need to update the API endpoint pointing to your newly hosted Render backend. Add an environment variable in Vercel `VITE_API_URL` and update the `App.jsx` fetch URL (currently `http://localhost:8000/predict`) to use `import.meta.env.VITE_API_URL`.
6. Click Deploy!
