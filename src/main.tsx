import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AdminProvider } from './context/AdminContext';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AdminProvider>
        <App />
      </AdminProvider>
    </React.StrictMode>
  );
}
