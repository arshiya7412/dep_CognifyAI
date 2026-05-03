# Cognify AI

Cognify AI is an intelligent learning and revision assistant. Paste your notes, articles, or upload textbooks (PDFs or Images) to instantly generate study plans, quizzes, flashcards, and knowledge summaries.

**🚀 Live Demo:** [https://depcognifyai-production.up.railway.app/](https://depcognifyai-production.up.railway.app/)

## Features

- **Three Dedicated Modes:**
  - **Student Revision Hub:** Generates personalized study plans, prioritized questions, and flashcards from your notes.
  - **Examiner Dashboard:** Upload materials to generate exam papers, marking schemes, and coverage analysis.
  - **General Knowledge Base:** Paste text or upload documents to get concept summaries and general quizzes.
- **Multimodal Support:** Upload PDFs or Images for instant AI analysis.
- **Session History:** Automatically saves your previous chats and AI-generated study materials to your local storage.
- **Modern UI:** Clean, responsive interface built with Tailwind CSS.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Lucide React (Icons)
- **Backend:** Node.js, Express
- **AI Integration:** Google Gemini API (`@google/genai` SDK)

## Local Development

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (based on `.env.example`) and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Deployment (Railway)

This application is configured to be deployed easily on [Railway](https://railway.app/):

1. Create a new project on Railway and deploy from your GitHub repo.
2. In your Railway project variables, add the following:
   - `GEMINI_API_KEY`: Your valid Gemini API Key.
   - *(Railway will automatically handle the `PORT` variable)*
3. Railway will automatically install dependencies, run the build script, and start the Express server serving your frontend and backend api.
