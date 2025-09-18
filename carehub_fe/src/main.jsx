import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { OfficeProvider } from './context/OfficeContext.jsx';
import { BrowserRouter } from 'react-router-dom';
import "./i18n.js";

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <OfficeProvider>
        <App />
      </OfficeProvider>
    </BrowserRouter>
);