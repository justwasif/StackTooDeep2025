import axios from 'axios';

// Change this URL to match your backend port (e.g., http://localhost:8000)
const API_URL = 'http://localhost:8000/api/v1'; 

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANT: This allows cookies to be sent/received
});


export default api;