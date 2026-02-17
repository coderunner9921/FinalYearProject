// src/pages/Settings.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Home, User, Lock, AlertTriangle,
  Loader2, CheckCircle, XCircle, Save
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentTheme, themes, changeTheme, theme } = useTheme();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete account
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deleteCountdown, setDeleteCountdown] = useState(5);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    const token = localStorage.getItem('token');
    setSaving(true);

    try {
      const res = await fetch('https://finalyearproject-t10v.onrender.com/api/settings/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (res.ok) {
        showMessage('success', 'Password changed successfully!');
        setShowPasswordChange(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await res.json();
        showMessage('error', error.detail || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      showMessage('error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete account with undo option
  const handleDeleteAccount = () => {
    const password = prompt('⚠️ Enter your password to confirm account deletion:');
    if (!password) return;

    setDeleteConfirmation(password);
    setDeleteCountdown(5);
    showMessage('error', 'Account will be deleted in 5 seconds. Click "Undo" to cancel.');
  };

  // Countdown effect
  useEffect(() => {
    if (deleteConfirmation && deleteCountdown > 0) {
      const timer = setTimeout(() => {
        setDeleteCountdown(deleteCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (deleteConfirmation && deleteCountdown === 0) {
      executeAccountDeletion(deleteConfirmation);
    }
  }, [deleteConfirmation, deleteCountdown]);

  const executeAccountDeletion = async (password) => {
    const token = localStorage.getItem('token');
    setSaving(true);

    try {
      const res = await fetch(`https://finalyearproject-t10v.onrender.com/api/settings/account?current_password=${encodeURIComponent(password)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showMessage('success', 'Account deleted successfully');
        setTimeout(() => {
          logout();
          navigate('/');
        }, 1500);
      } else {
        const error = await res.json();
        showMessage('error', error.detail || 'Failed to delete account');
        setDeleteConfirmation(null);
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      showMessage('error', 'Network error. Please try again.');
      setDeleteConfirmation(null);
    } finally {
      setSaving(false);
    }
  };

  const cancelDeletion = () => {
    setDeleteConfirmation(null);
    setDeleteCountdown(5);
    showMessage('success', 'Account deletion cancelled');
  };

  // Theme selection handler
  const handleThemeChange = (themeKey) => {
    changeTheme(themeKey);
    showMessage('success', `Theme changed to ${themes[themeKey].name}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`w-16 h-16 ${theme.colors.accent} animate-spin mx-auto mb-4`} />
          <p className={theme.colors.textPrimary}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} p-6 relative overflow-hidden`}>
      {/* Animated Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 -left-40 w-96 h-96 ${theme.colors.decorativeBg1} rounded-full blur-3xl opacity-20 animate-pulse`}></div>
        <div className={`absolute top-40 -right-40 w-96 h-96 ${theme.colors.decorativeBg2} rounded-full blur-3xl opacity-20 animate-pulse`} style={{animationDelay: '1s'}}></div>
        <div className={`absolute -bottom-40 left-1/3 w-96 h-96 ${theme.colors.decorativeBg3} rounded-full blur-3xl opacity-20 animate-pulse`} style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Message Toast with Undo for Deletion */}
        {message.text && (
          <div className={`fixed top-4 right-4 z-50 rounded-xl border flex items-center gap-3 shadow-xl animate-slide-in ${
            currentTheme === 'daylight' 
              ? message.type === 'success'
                ? 'bg-green-50 border-green-400 text-green-800'
                : 'bg-red-50 border-red-400 text-red-800'
              : message.type === 'success' 
                ? 'bg-green-500/20 backdrop-blur-xl border-green-500/50 text-green-300' 
                : 'bg-red-500/20 backdrop-blur-xl border-red-500/50 text-red-300'
          }`}>
            <div className="px-6 py-4 flex items-center gap-3 flex-1">
              {message.type === 'success' ? (
                <CheckCircle className={`w-5 h-5 ${currentTheme === 'daylight' ? 'text-green-600' : ''}`} />
              ) : (
                <XCircle className={`w-5 h-5 ${currentTheme === 'daylight' ? 'text-red-600' : ''}`} />
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
            {deleteConfirmation && (
              <button
                onClick={cancelDeletion}
                className={`px-4 py-4 font-bold border-l ${
                  currentTheme === 'daylight'
                    ? 'border-red-300 hover:bg-red-100 text-red-700'
                    : 'border-red-500/30 hover:bg-red-500/20 text-red-200'
                }`}
              >
                UNDO ({deleteCountdown}s)
              </button>
            )}
          </div>
        )}

        {/* ✅ NEW - Navigation Bar */}
        <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-3xl p-6 mb-6 ${theme.colors.shadow}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme.colors.textPrimary} mb-2`}>Settings</h1>
              <p className={`${theme.colors.textSecondary}`}>
                Manage your account, security, and preferences
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/master-dashboard')}
                className={`px-4 py-2 ${theme.colors.btnSecondary} rounded-xl font-semibold transition-all flex items-center gap-2`}
                title="Dashboard"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className={`px-4 py-2 ${theme.colors.btnSecondary} rounded-xl font-semibold transition-all flex items-center gap-2`}
                title="Profile"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Theme */}
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-3xl p-6 ${theme.colors.shadow}`}>
            <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-6`}>Appearance & Theme</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              {Object.entries(themes).map(([key, themeData]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`relative group rounded-2xl overflow-hidden transition-all hover:scale-105 ${
                    currentTheme === key ? `ring-2 ${theme.colors.border}` : ''
                  }`}
                >
                  <div className={`${themeData.preview} p-6 border-2 rounded-2xl`}>
                    <div className="w-12 h-12 mx-auto bg-white/20 rounded-full"></div>
                  </div>
                  <p className={`${theme.colors.textPrimary} font-semibold mt-2 text-sm`}>
                    {themeData.name}
                  </p>
                  {currentTheme === key && (
                    <div className={`absolute top-2 right-2 w-6 h-6 ${theme.colors.accentBg} rounded-full flex items-center justify-center`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className={`${theme.colors.bgGlass} backdrop-blur-sm border ${theme.colors.borderLight} rounded-xl p-4`}>
              <p className={`${theme.colors.textMuted} text-sm mb-2`}>
                Current theme: <span className={`${theme.colors.accent} font-semibold`}>{themes[currentTheme].name}</span>
              </p>
              <p className={`${theme.colors.textMuted} text-xs`}>
                Choose your preferred color scheme. Your selection will be saved automatically.
              </p>
            </div>
          </div>

          {/* Right Column - Security */}
          <div className="space-y-6">
            
            {/* Password Change Section */}
            <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-3xl p-6 ${theme.colors.shadow}`}>
              <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-6`}>Password & Security</h2>
              
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className={`w-full px-4 py-3 ${theme.colors.btnSecondary} rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-4`}
              >
                <Lock className="w-5 h-5" />
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>

              {showPasswordChange && (
                <div className="space-y-3 pt-2">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500`}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min 8 characters)"
                    className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500`}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500`}
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className={`w-full px-4 py-3 ${theme.colors.btnPrimary} rounded-xl transition-all`}
                  >
                    {saving ? 'Changing...' : 'Confirm Password Change'}
                  </button>
                </div>
              )}
            </div>

            {/* Delete Account Section */}
            <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-3xl p-6 ${theme.colors.shadow}`}>
              <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-6`}>Danger Zone</h2>
              
              <p className={`${theme.colors.textMuted} text-sm mb-4`}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                className={`w-full px-4 py-3 ${theme.colors.btnDanger} rounded-xl font-semibold transition-all flex items-center justify-center gap-2`}
              >
                <AlertTriangle className="w-5 h-5" />
                {saving ? 'Processing...' : 'Delete Account'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}