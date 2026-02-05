import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './admin/auth';
import { registerServiceWorker, setupNetworkStatusMonitoring } from './utils/serviceWorker';
import './styles.css';

// Register service worker for performance and offline support
registerServiceWorker();

// Setup network status monitoring
setupNetworkStatusMonitoring();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
