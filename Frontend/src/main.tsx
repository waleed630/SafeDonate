import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { RealtimeProvider } from './contexts/RealtimeContext.tsx'
import { CategoriesProvider } from './contexts/CategoriesContext.tsx'
import { TagsProvider } from './contexts/TagsContext.tsx'

// PWA: register the production service worker (Vite/React entry — same role as CRA index.js).
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RealtimeProvider>
        <CategoriesProvider>
          <TagsProvider>
            <App />
          </TagsProvider>
        </CategoriesProvider>
      </RealtimeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
