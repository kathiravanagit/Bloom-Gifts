// Automatically use the deployed backend on production, local backend in dev
window.API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://bloom-gifts-backend.onrender.com'; // ← update this after deploying to Render
