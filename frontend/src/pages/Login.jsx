import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/login', formData);

      navigate('/login/bridge');

    } catch (error) {
      console.error(error);
      alert('Login failed. Check credentials.');
    }
  };

  return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8e692] text-[#8100c8]">
        <div className="w-full max-w-md p-8 space-y-6 bg-white border-4 border-[#8100c8] rounded-lg shadow-lg">
          <h2 className="text-4xl font-game text-center text-[#8100c8]">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                placeholder="Email or Username"
                className="w-full p-3 bg-[#f8e692] border-2 border-[#8100c8] rounded focus:outline-none focus:border-[#ff00d6] text-[#8100c8] font-marker"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
                type="password"
                placeholder="Password"
                className="w-full p-3 bg-[#f8e692] border-2 border-[#8100c8] rounded focus:outline-none focus:border-[#ff00d6] text-[#8100c8] font-marker"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button type="submit" className="w-full p-3 bg-[#ff00d6] border-4 border-[#8100c8] rounded hover:bg-[#8100c8] hover:text-[#f8e692] font-marker text-lg text-[#f8e692] uppercase">
              Login
            </button>
          </form>

          <p className="text-center text-[#8100c8] font-marker">
            Don't have an account? <Link to="/signup" className="text-[#ff00d6] hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
  );
}

export default Login;