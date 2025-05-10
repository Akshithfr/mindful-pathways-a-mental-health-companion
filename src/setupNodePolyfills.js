// src/setupNodePolyfills.js
window.global = window;
window.process = { env: { NODE_ENV: process.env.NODE_ENV } };