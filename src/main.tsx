import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

interface AppGlobals {
  __APP_BASE_URL__?: string;
}

const appGlobals = globalThis as AppGlobals;
appGlobals.__APP_BASE_URL__ = import.meta.env.BASE_URL;

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
