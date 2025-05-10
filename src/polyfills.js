// src/polyfills.js
if (typeof window !== 'undefined' && !window.process) {
    window.process = {
      env: {
        NODE_ENV: 'development',
        REACT_APP_API_URL: 'http://localhost:5000/api'
      }
    };
  }