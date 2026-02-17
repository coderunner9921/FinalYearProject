// config.js
const config = {
  // Use environment variable or default to localhost for development
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
};

export default config;