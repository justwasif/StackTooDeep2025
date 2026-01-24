import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Call your backend login API
      await api.post('/users/login', formData);
      
      // 2. Redirect to CardDirect on success
      navigate('/login/bridge'); 
      
    } catch (error) {
      console.error(error);
      alert('Login failed. Check credentials.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Email or Username"
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          
          {/* Removed <Link> wrapper so the form submits correctly */}
          <button type="submit" className="w-full p-3 bg-green-600 rounded hover:bg-green-700 font-bold">
            Login
          </button>
        </form>
        
        <p className="text-center text-gray-400">
          Don't have an account? <Link to="/signup" className="text-green-400 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;