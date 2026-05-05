import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://fsd-project-81bb.onrender.com';

const roles = ['Student', 'Faculty'];

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('Student');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendConnected, setBackendConnected] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const res = await axios.get(`${API_BASE.replace('/api', '')}/api/health`);
        setBackendConnected(res.data.status === 'ok');
      } catch (err) {
        setBackendConnected(false);
      }
    };
    testConnection();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!form.name || !form.email || !form.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      
      const user = await signup({
        ...form,
        role: activeRole,
      });
      
      if (user && user.role) {
        if (user.role === 'Faculty' || user.role === 'Admin') {
          setTimeout(() => navigate('/faculty', { replace: true }), 0);
        } else if (user.role === 'Student') {
          setTimeout(() => navigate('/student', { replace: true }), 0);
        } else {
          setTimeout(() => navigate('/login', { replace: true }), 0);
        }
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      let errorMessage = 'Unable to sign up. ';
      
      if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        errorMessage += 'Cannot connect to server. Make sure backend is running on port 5001.';
      } else if (err?.response?.status === 409) {
        errorMessage += 'Email already in use. Try logging in instead.';
      } else if (err?.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full bg-black text-white rounded-2xl px-8 py-10">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">
            JOIN WORKSPACE
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Create your account
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Choose a role that matches how you use feedback.
          </p>
        </div>

        <div className="flex mb-6 bg-gray-900 rounded-full p-1">
          {roles.map((role) => {
            const active = activeRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                className={`flex-1 rounded-full text-xs font-medium py-2 transition-colors ${
                  active
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>

        {backendConnected === false && (
          <div className="mb-4 p-3 bg-red-900/30 rounded-lg">
            <p className="text-xs text-red-400 font-medium mb-1">⚠️ Backend Not Connected</p>
            <p className="text-xs text-red-500">
              Cannot reach backend server. Make sure backend is running on port 5001.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium tracking-wide text-gray-400 mb-1.5">
              Full name
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Dr. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium tracking-wide text-gray-400 mb-1.5">
              University email
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="you@university.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-medium tracking-wide text-gray-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Create a secure password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-xl bg-white text-black text-sm font-medium tracking-wide py-2.5 mt-1 transition-colors hover:bg-gray-200 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : `Sign up as ${activeRole}`}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-white hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
