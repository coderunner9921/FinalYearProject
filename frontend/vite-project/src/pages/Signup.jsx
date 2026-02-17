// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, Palette
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { signup as signupApi } from "../utils/api";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, themes, currentTheme, changeTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await signupApi(formData.name, formData.email, formData.password);
      login(data.access_token, data.user);
      navigate("/dashboard");
    } catch (err) {
      let errorMessage = "Signup failed. Please try again.";
      if (err.message) errorMessage = err.message;

      if (errorMessage.includes("already registered")) {
        errorMessage = "This email is already registered. Please login instead.";
      } else if (errorMessage.includes("Network") || errorMessage.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center p-4 sm:p-6 relative overflow-hidden`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute w-96 h-96 ${theme.colors.decorativeBg1} rounded-full blur-3xl opacity-30 -top-48 -left-48 animate-pulse`}></div>
        <div className={`absolute w-96 h-96 ${theme.colors.decorativeBg2} rounded-full blur-3xl opacity-30 -bottom-48 -right-48 animate-pulse`} style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back & Theme Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className={`${theme.colors.textSecondary} hover:${theme.colors.textPrimary} transition-colors text-sm font-medium`}
          >
            ← Back to Home
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

        <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-2xl p-6 sm:p-8 ${theme.colors.shadow}`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${theme.colors.btnPrimary} rounded-xl flex items-center justify-center mx-auto mb-4 ${theme.colors.shadow}`}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className={`text-2xl sm:text-3xl font-bold ${theme.colors.textPrimary} mb-2`}>Create Account</h2>
            <p className={`${theme.colors.textSecondary} text-sm sm:text-base`}>Start your interview preparation journey</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 ${theme.colors.btnDanger} rounded-xl flex items-start gap-3`}>
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-2`}>Full Name</label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.colors.textMuted}`} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} outline-none transition-all`}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-2`}>Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.colors.textMuted}`} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} outline-none transition-all`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-2`}>Password</label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.colors.textMuted}`} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} outline-none transition-all`}
                  placeholder="Create a password (min 6 characters)"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-2`}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.colors.textMuted}`} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} outline-none transition-all`}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Note */}
            <div className={`${theme.colors.bgCard} border ${theme.colors.borderLight} rounded-xl p-4 text-xs ${theme.colors.textSecondary} flex items-start gap-2`}>
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <p>Password must be at least 6 characters long</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-6 py-4 ${theme.colors.btnPrimary} rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${theme.colors.borderLight}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${theme.colors.bgCard} ${theme.colors.textMuted}`}>or</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className={theme.colors.textSecondary}>
              Already have an account?{" "}
              <Link
                to="/login"
                className={`${theme.colors.accent} hover:underline font-semibold transition-colors`}
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}