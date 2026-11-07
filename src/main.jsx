import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './app.css';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);

// offline + instalação na tela de início (só em https ou localhost).
// BASE_URL: na raiz em dev, em /ritmo/ no GitHub Pages.
if ('serviceWorker' in navigator) {
  const sw = import.meta.env.BASE_URL + 'sw.js';
  addEventListener('load', () => navigator.serviceWorker.register(sw).catch(() => {}));
}
