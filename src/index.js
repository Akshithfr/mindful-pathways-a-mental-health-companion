import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';
import process from 'process';
import './polyfills';
import './setupNodePolyfills';
import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.process = process;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);