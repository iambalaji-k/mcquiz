# ⚡ QuizPlayer - Premium MCQ Practice Platform

QuizPlayer is a modern, lightweight, mobile-first, offline-ready web application designed for high-yield Multiple Choice Question (MCQ) practice and exam preparation. Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**, it runs 100% client-side with zero backend dependencies.

Practice directly from the built-in question repository, upload your own custom JSON/CSV files, or convert existing spreadsheets into standardized quiz formats with one click.

---

## 🚀 Key Features

* **🌐 GitHub Quiz Explorer (`/explore`)**:
  * Dynamically browse, search, and load questionnaires stored in the repository's [`questions/`](./questions) catalog via the GitHub REST API.
  * Real-time search across categories and file sets.
  * 2-hour smart `localStorage` caching to maximize speed and prevent GitHub API rate limits.
  * Full offline fallback once a quiz is loaded.

* **📊 Built-in CSV to JSON Converter (`/convert`)**:
  * Easily convert spreadsheets (`.csv`) into schema-compliant quiz JSON files.
  * Visual live validation with instant feedback on syntax or structure issues.
  * Download the converted `.json` file or immediately start practicing.
  * Includes a downloadable [`quiz-template.csv`](./quiz-template.csv) template.

* **🎯 Pre-Test Setup & Balanced Question Sampling**:
  * Before starting any test, inspect total available questions and topic breakdown.
  * Choose the exact number of questions you wish to attempt (defaults to all questions).
  * **Balanced Multi-Topic Sampling**: Intelligently draws questions across all distinct concepts and topics using balanced round-robin sampling rather than clustering on a single topic.
  * Optional question and concept sequence randomization for high-yield exam simulation.
  * Only launches the attempt upon explicit user confirmation.

* **⚡ Practice & Test Engine (`/quiz`)**:
  * One-question-at-a-time focused practice interface.
  * Instant answer locking with color-coded feedback (correct vs. wrong) and comprehensive explanations.
  * Question Navigation Palette to jump across questions and visually inspect status (unanswered, correct, incorrect).
  * Live attempt timer and running score tracking.

* **💾 Session Autosaving & Recovery**:
  * Automatically records your active session, question responses, and elapsed timer in `localStorage`.
  * Resume practicing anytime without losing progress after browser reloads.

* **🔍 Comprehensive Review & Analytics (`/result`)**:
  * Detailed breakdown with overall accuracy, score, completion time, and category performance.
  * Interactive review palette with filters for *All*, *Correct*, and *Wrong* answers.
  * Live search filter across questions and explanation text.
  * Option to retry missed questions or restart the entire attempt.

* **🎨 Modern UI & Dark Mode**:
  * Premium aesthetic built with Tailwind CSS v4 and Lucide icons.
  * Seamless light / dark mode switching with persistent user preference.
  * Fully responsive design optimized for mobile, tablet, and desktop screens.

* **📱 Installable & Offline PWA**:
  * Client-side architecture with Service Worker support for complete offline availability.

---

## 📚 Question Bank

The repository comes pre-loaded with curated questionnaires in [`questions/`](./questions):

* **Advanced IT (ADVITT)**:
  * Forensic Accounting and Fraud Detection
  * Basics of Digital Forensics and Cyber Security
  * Robotic Process Automation (RPA)
  * Oracle Fusion ERP
  * Microsoft Dynamics
  * Power BI
  * Python Programming
  * KNIME Analytics

---

## 📁 Project Directory Structure

```text
mcqquiz/
├── public/                 # Static assets, favicon, manifest
├── questions/              # Repository quiz question bank
│   └── ADVITT/             # Advanced IT MCQ sets (.json)
├── src/
│   ├── assets/             # Images and branding assets
│   ├── components/         # Reusable UI components (ErrorBoundary, etc.)
│   ├── context/            # React Context (QuizContext)
│   ├── hooks/              # Custom hooks (useQuiz)
│   ├── pages/              # Application views
│   │   ├── Home.tsx            # Landing page & JSON loader
│   │   ├── QuizExplorer.tsx    # GitHub directory browser
│   │   ├── CsvConverter.tsx    # CSV to JSON conversion studio
│   │   ├── QuizPlayer.tsx      # Interactive practice engine
│   │   └── ResultSummary.tsx   # Scorecard & review analytics
│   ├── types/              # TypeScript interfaces & types
│   ├── utils/              # Parsers, validation, and GitHub API services
│   ├── App.tsx             # Root router & layout
│   └── main.tsx            # Entry point
├── quiz-schema.json        # JSON Schema specification
├── quiz-template.csv       # Starter template for CSV question sets
└── vite.config.ts          # Vite build configuration
```

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite 6+](https://vite.dev/)
* **CSS / Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Animations & Celebration**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
* **Routing**: [React Router 7 (HashRouter)](https://reactrouter.com/)
* **Testing Library**: [Vitest](https://vitest.dev/) + [JSDOM](https://github.com/jsdom/jsdom)

---

## 📄 Data Formats & Schemas

### 1. JSON Format (`quiz-schema.json`)

```json
{
  "title": "Sample Quiz Title",
  "description": "Short description of the quiz topics",
  "version": "1.0",
  "questions": [
    {
      "id": 1,
      "category": "Topic Name",
      "question": "Which of the following statements is correct?",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "answer": 1,
      "explanation": "Detailed explanation for why option 2 is correct."
    }
  ]
}
```

#### Validation Rules:
* **`title`**: Non-empty string.
* **`questions`**: Array with at least 1 question item.
* **`id`**: Unique string or number identifier for each question.
* **`category`**: Non-empty string.
* **`question`**: Non-empty string containing the question prompt.
* **`options`**: Array of 2 to 6 options (strings or numbers).
* **`answer`**: 0-based index integer pointing to the correct option (`0` for first option, `1` for second, etc.).
* **`explanation`**: Non-empty explanation string.

---

### 2. CSV Format (`quiz-template.csv`)

You can create quizzes in Excel or Google Sheets and export them as `.csv`:

| Column Header | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `id` | Optional | Question identifier (auto-assigned if omitted) | `1` |
| `category` | Yes | Subject or category name | `Information Security` |
| `question` | Yes | Question prompt text | `What does CIA stand for?` |
| `option_1` | Yes | First choice | `Confidentiality, Integrity, Availability` |
| `option_2` | Yes | Second choice | `Control, Identity, Authentication` |
| `option_3` | Optional | Third choice | `Central Intelligence Agency` |
| `option_4` | Optional | Fourth choice | `Cyber Incident Assessment` |
| `option_5` | Optional | Fifth choice | |
| `option_6` | Optional | Sixth choice | |
| `answer` | Yes | 1-based option number (`1` to `6`) | `1` |
| `explanation` | Yes | Explanation for the solution | `CIA triad is Confidentiality...` |

*(Note: The CSV converter automatically translates 1-based CSV answers to 0-based internal indexes).*

---

## 💻 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* `npm`

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/iambalaji-k/mcquiz.git
   cd mcquiz
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🧪 Testing

Run the automated test suite powered by **Vitest**:

```bash
npm run test
```

Tests cover:
* JSON schema validation (missing fields, duplicate IDs, invalid types, out-of-range answers).
* CSV parsing and index conversion.
* Edge cases and malformed inputs.

---

## ⚙️ Deployment

The project uses `HashRouter` and relative asset paths, making it deployable on any static hosting service (GitHub Pages, Cloudflare Pages, Vercel, Netlify) with zero server configuration.

### GitHub Pages (Automated CI/CD)
The repository includes an automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically tests, builds, and deploys the app on every push to `main`.

