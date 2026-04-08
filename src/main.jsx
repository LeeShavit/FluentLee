import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.jsx'

// Amplify config is auto-generated after first deploy
// Import will fail locally until `npx ampx sandbox` or Amplify deploy runs
try {
  const outputs = await import(/* @vite-ignore */ '../amplify_outputs.json')
  Amplify.configure(outputs.default)
} catch {
  console.log('Amplify outputs not found — running in local/localStorage mode')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
