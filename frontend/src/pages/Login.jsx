import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../store/authSlice';
import client from '../api/client';
import { KeyRound, Mail, ArrowRight, Loader2, PackageSearch } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await client.post('/token/', { username, password });
      dispatch(loginSuccess({ 
        token: response.data.access, 
        isStaff: response.data.is_staff,
        user: { username: response.data.username } 
      }));
      navigate('/');
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = () => {
    dispatch(loginSuccess({ 
      token: 'test-token', 
      isStaff: true, 
      user: { username: 'Admin' } 
    }));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <PackageSearch size={24} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome to StockFlow
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to manage your inventory
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 rounded-lg shadow-sm sm:px-10">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 text-sm bg-white"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 text-sm bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-850 disabled:opacity-50 transition-colors shadow-sm"
              >
                <span className="flex items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Sign In'}
                  {!loading && <ArrowRight size={16} />}
                </span>
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleTestLogin}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-4"
              >
                Bypass Login for Testing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
