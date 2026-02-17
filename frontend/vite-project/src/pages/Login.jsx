// frontend/vite-project/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://finalyearproject-t10v.onrender.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      login(data.user, data.access_token);
      navigate('/master-dashboard'); // Redirect to master dashboard, not flexyourbrain
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center p-4`}>
      <div className={`max-w-md w-full ${theme.colors.bgCard} backdrop-blur-xl rounded-2xl p-8 ${theme.colors.shadow}`}>
        <h2 className={`text-3xl font-bold ${theme.colors.textPrimary} mb-6 text-center`}>Welcome Back</h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block ${theme.colors.textSecondary} mb-2`}>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={`w-full px-4 py-2 ${theme.colors.bgInput} border ${theme.colors.border} rounded-lg ${theme.colors.textPrimary} focus:outline-none ${theme.colors.borderFocus}`}
            />
          </div>

          <div>
            <label className={`block ${theme.colors.textSecondary} mb-2`}>Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className={`w-full px-4 py-2 ${theme.colors.bgInput} border ${theme.colors.border} rounded-lg ${theme.colors.textPrimary} focus:outline-none ${theme.colors.borderFocus}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${theme.colors.btnPrimary} py-3 rounded-lg font-semibold transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/forgot-password" className={`${theme.colors.accent} hover:underline text-sm`}>
            Forgot Password?
          </Link>
        </div>

        <div className="mt-4 text-center">
          <p className={`${theme.colors.textSecondary}`}>
            Don't have an account?{' '}
            <Link to="/signup" className={`${theme.colors.accent} hover:underline`}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}