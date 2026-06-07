import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QuizProvider } from './context/QuizContext'

// Register Service Worker for Offline PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/mcqquiz/sw.js')
      .then((reg) => console.log('Service Worker registered with scope: ', reg.scope))
      .catch((err) => console.error('Service Worker registration failed: ', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuizProvider>
      <App />
    </QuizProvider>
  </StrictMode>,
)

