import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AppProvider } from './contexts/AppContext';
import { TimerProvider } from './contexts/TimerContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </AppProvider>
  </React.StrictMode>
);
