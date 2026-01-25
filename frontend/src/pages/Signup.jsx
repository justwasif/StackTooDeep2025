import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

function Signup() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/register', formData);
      alert('Signup successful! Please login.');
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert('Signup failed: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8e692] text-[#8100c8]">
        <div className="w-full max-w-md p-8 space-y-6 bg-white border-4 border-[#8100c8] rounded-lg shadow-lg">
          <h2 className="text-4xl font-game text-center text-[#8100c8]">Sign Up</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                placeholder="Username"
                className="w-full p-3 bg-[#f8e692] border-2 border-[#8100c8] rounded focus:outline-none focus:border-[#ff00d6] text-[#8100c8] font-marker"
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <input
                type="email"
                placeholder="Email"
                className="w-full p-3 bg-[#f8e692] border-2 border-[#8100c8] rounded focus:outline-none focus:border-[#ff00d6] text-[#8100c8] font-marker"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
                type="password"
                placeholder="Password"
                className="w-full p-3 bg-[#f8e692] border-2 border-[#8100c8] rounded focus:outline-none focus:border-[#ff00d6] text-[#8100c8] font-marker"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button type="submit" className="w-full p-3 bg-[#74aaee] border-4 border-[#8100c8] rounded hover:bg-[#8100c8] hover:text-[#f8e692] font-marker text-lg text-[#8100c8] uppercase">
              Create Account
            </button>
          </form>
          <p className="text-center text-[#8100c8] font-marker">
            Already have an account? <Link to="/login" className="text-[#74aaee] hover:underline">Login</Link>
          </p>
        </div>
      </div>
  );
}

export default Signup;