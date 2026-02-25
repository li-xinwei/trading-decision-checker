# Ask Brooks API

FastAPI backend that proxies questions to NotebookLM using Al Brooks' price action books as knowledge base.

## Setup

1. Install dependencies:
   ```bash
   cd api
   pip install -r requirements.txt
   python -m playwright install chromium
   ```

2. Login to NotebookLM (one-time, generates `storage_state.json`):
   ```bash
   python -m notebooklm login
   ```

3. Copy `.env.example` to `.env` and fill in your notebook URL:
   ```bash
   cp .env.example .env
   ```

4. Run:
   ```bash
   python main.py
   ```

## Endpoints

- `GET /health` — Health check
- `POST /ask` — Ask a question
  ```json
  { "question": "How to identify a strong breakout?" }
  ```
  Response:
  ```json
  {
    "answer": "A strong breakout has...",
    "sources": ["Trading Price Action Trends", ...]
  }
  ```

## Deploy to Railway

1. Create new project on Railway
2. Connect this repo, set root directory to `api/`
3. Add environment variables from `.env.example`
4. Upload `storage_state.json` as a volume or secret file
