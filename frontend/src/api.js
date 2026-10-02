import axios from 'axios';

// Use the environment variable if available, otherwise fallback to the production Render URL
const API_URL = import.meta.env.VITE_API_URL || 'https://stacktoodeep2025.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANT: This allows cookies to be sent/received
});


export default api;