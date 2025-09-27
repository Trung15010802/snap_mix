import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Get root element with proper type checking
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML.')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)