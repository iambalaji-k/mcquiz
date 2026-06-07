# ⚡ QuizPlayer - Premium MCQ Practice Platform

QuizPlayer is a lightweight, mobile-first, production-ready offline web application designed to run multiple-choice question (MCQ) quizzes. Built specifically for exam preparation, it allows users to load custom JSON practice files and begin practicing instantly.

The application is designed to be hosted statically (e.g., on **GitHub Pages**) and runs entirely in the user's browser. It features a modern premium interface (Tailwind CSS v4, custom HSL gradients, glassmorphism elements), immediate answer locking and evaluation, detailed explanations, a question navigation palette, search and filter features, PWA support for offline usage, and robust session autosaving.

---

## 🚀 Key Features

* **Instant JSON Loader**: Select or drag-and-drop any quiz JSON file adhering to the correct schema.
* **Practice Engine**: Displays one question at a time. Answers lock immediately upon selection, providing green/red feedback, showing correct choices, and displaying detailed explanations.
* **Smart Navigation Palette**: Jump freely between questions using an interactive grid displaying the visual correctness states (unanswered, correct, incorrect).
* **Autosave Session**: Automatically saves your current quiz state, elapsed timer, and answers in `localStorage` under `quiz-app-active-session`. If you refresh, progress is restored.
* **Review Mode**: Review all questions after completion. Filter by category, answer correctness (All, Correct, Wrong), or perform a live text search across questions and explanations.
* **Responsive, Premium Design**: Designed mobile-first with comfortable touch targets, elegant color palettes, fluid animations, and native-feeling scrollbars.
* **Light / Dark Mode**: Seamlessly toggle between theme colors, persisted automatically in browser memory.
* **Installable PWA**: Includes a Web manifest and custom Service Worker caching system enabling 100% offline usage.
* **Strict Validation**: Detailed syntax and content check on uploaded files, generating user-friendly error logs for debugging.
* **Automatic CI/CD**: Automatic builds, quality unit tests, and deployments to GitHub Pages on pushes to the `main` branch.

---

## 📁 Project Directory Structure

```text
src/
├── components/          # Reusable UI components (ErrorBoundary, etc.)
├── pages/               # Application screens (Home, QuizPlayer, ResultSummary)
├── hooks/               # Custom React hooks (useQuiz)
├── services/            # Core services
├── utils/               # Helper utilities (JSON validation, helpers)
├── types/               # TypeScript interfaces (Quiz, Question, etc.)
├── context/             # React Context providers (QuizContext)
├── routes/              # Routing configurations
├── styles/              # Global styles (Tailwind, index.css)
└── assets/              # Static assets (logos, images)
```

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite 8](https://vite.dev/)
* **CSS / Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Animations & Celebration**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
* **Routing**: [React Router 6 (HashRouter)](https://reactrouter.com/)
* **Testing Library**: [Vitest](https://vitest.dev/) + [JSDOM](https://github.com/jsdom/jsdom)

---

## 📄 JSON Schema Format

Quizzes loaded into the app must follow this schema:

```json
{
  "title": "Income Tax Practice Set 01",
  "description": "Practice questions",
  "version": "1.0",
  "questions": [
    {
      "id": 1,
      "category": "Income Tax",
      "question": "What is the basic exemption limit?",
      "options": [
        "100000",
        "200000",
        "300000",
        "400000"
      ],
      "answer": 2,
      "explanation": "Current exemption limit is ..."
    }
  ]
}
```

### Strict Validation Rules
1. **Title**: Required, must be a non-empty string.
2. **Questions List**: Required, must contain at least one question.
3. **ID**: Required, must be a string or number, and **completely unique** across all questions.
4. **Category**: Required, must be a non-empty string.
5. **Question Text**: Required, must be a non-empty string.
6. **Options**: Must be an array of strings or numbers, containing **between 2 and 6 options**.
7. **Answer**: Required, must be a number corresponding to the correct option index (0-indexed).
8. **Explanation**: Required, must be a non-empty string.

---

## 💻 Running Locally

Follow these steps to run the application in development mode:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mcqquiz
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local dev server**:
   ```bash
   npm run dev
   ```
   *The application will boot up under `http://localhost:5173/mcqquiz/` (respecting the base routing path).*

4. **Verify production building**:
   ```bash
   npm run build
   ```

---

## 🧪 Testing

The project uses **Vitest** for unit testing. The test suite checks the JSON parser and validator for edge cases like duplicate IDs, out-of-bound indices, missing properties, and corrupt structures.

To run the unit tests, use:
```bash
npm run test
```

---

## ⚙️ GitHub Pages Deployment

The application compiles assets using `HashRouter` and a base path prefix `/mcqquiz/` which matches the GitHub Pages directory.

A GitHub Actions workflow is preconfigured in `.github/workflows/deploy.yml`:
1. Triggers automatically on push to the `main` branch.
2. Runs the test suite to verify quality.
3. Runs the production compiler.
4. Deploys the built files automatically to your GitHub Pages URL: `https://<username>.github.io/mcqquiz/`.
