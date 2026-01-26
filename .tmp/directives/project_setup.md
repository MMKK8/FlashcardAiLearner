# Project Setup Directive

## Goal
Initialize the `Flashcard AI Learner` project with a split Frontend/Backend architecture.

## Architecture
- **Root**: `/Users/marcinkozarzewski/antigravity/Flashcard AI Learner `
- **Frontend**: Next.js (React) in `frontend/`
- **Backend**: Node.js (Express) in `backend/`
- **Database**: PostgreSQL (External)

## Checklist
1.  **Backend Initialization**
    - [ ] Create `backend/` directory.
    - [ ] Initialize `package.json` (Express, PG, Dotenv, Gemini).
    - [ ] Create `backend/src/index.js` (Entry point).
    - [ ] Create `backend/.env` (API Keys, DB Config).

2.  **Frontend Initialization**
    - [ ] Create `frontend/` directory.
    - [ ] Initialize Next.js project.
    - [ ] Install dependencies (Tailwind, Axios).
    - [ ] Create `frontend/.env.local` (API URL).

3.  **Database Connection**
    - [ ] Verify connection to 192.168.68.110.
    - [ ] Run initial migration script (Schema creation).

## Environment Variables (.env)
```
# Backend
PORT=3001
DATABASE_USER=user1
DATABASE_PASSWORD=Kazio08
DATABASE_URL=postgres://user:password@192.168.68.110:5432/flashcards

GEMINI_API_KEY=AIzaSyAxM-32gncLepg36lF7DY7Q74U9gVDg2Hc
JWT_SECRET=needs_input

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
Github=https://github.com/MMKK8/FlashcardAiLearner

```
