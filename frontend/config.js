// Vercel frontend: https://bloomgifts.vercel.app
// Automatically switch between local development and the deployed Render API
window.API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://bloomgifts.onrender.com';
