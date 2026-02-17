// ============================================
// src/pages/ResetPassword.jsx
// ============================================
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, ArrowLeft, CheckCircle, Palette } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, themes, currentTheme, changeTheme } = useTheme();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const token = searchParams.get("token");

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setError("No reset token provided");
      setVerifying(false);
      return;
    }

    try {
      const res = await fetch(`https://finalyearproject-t10v.onrender.com/auth/verify-reset-token/${token}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Invalid or expired token");
      }

      const data = await res.json();
      setTokenValid(true);
      setEmail(data.email);
    } catch (err) {
      setError(err.message);
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://finalyearproject-t10v.onrender.com/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={theme.colors.textPrimary}>Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full">
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-3xl p-8 ${theme.colors.shadow}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
              
              <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-3`}>Invalid Reset Link</h2>
              
              <p className={`${theme.colors.textSecondary} mb-6`}>
                {error || "This password reset link is invalid or has expired."}
              </p>

              <Link
                to="/forgot-password"
                className={`inline-block px-6 py-3 ${theme.colors.btnPrimary} rounded-xl transition-all`}
              >
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full">
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-3xl p-8 ${theme.colors.shadow}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              
              <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-3`}>Password Reset Successful!</h2>
              
              <p className={`${theme.colors.textSecondary} mb-6`}>
                Your password has been updated. Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/login"
            className={`inline-flex items-center gap-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} transition-colors text-sm font-medium`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          {/* Theme Selector */}
          <div className="relative group">
            <button className={`p-2 ${theme.colors.bgCard} border ${theme.colors.borderLight} rounded-xl ${theme.colors.cardHover} transition-all backdrop-blur-xl`}>
              <Palette className={`w-5 h-5 ${theme.colors.textPrimary}`} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-xl p-2 ${theme.colors.shadow}`}>
                {Object.entries(themes).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => changeTheme(key)}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-all mb-1 last:mb-0 ${
                      currentTheme === key 
                        ? `${theme.colors.btnPrimary}` 
                        : `${theme.colors.bgGlass} ${theme.colors.textSecondary} hover:${theme.colors.bgCard}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${t.preview}`}></div>
                      <span className={currentTheme === key ? 'text-white font-semibold' : ''}>{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-3xl p-8 ${theme.colors.shadow}`}>
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${theme.colors.textPrimary} mb-2`}>Reset Password</h1>
            <p className={theme.colors.textSecondary}>
              Enter a new password for <strong className={theme.colors.textPrimary}>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block ${theme.colors.textPrimary} font-semibold mb-2`}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-400 ${theme.colors.borderFocus} outline-none transition-all`}
              />
            </div>

            <div>
              <label className={`block ${theme.colors.textPrimary} font-semibold mb-2`}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-400 ${theme.colors.borderFocus} outline-none transition-all`}
              />
            </div>

            {error && (
              <div className={`${theme.colors.btnDanger} rounded-xl p-4`}>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-6 py-3 ${theme.colors.btnPrimary} rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}