import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { NotificationsProvider } from './ui/NotificationsProvider.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </StrictMode>
  </BrowserRouter>
);
