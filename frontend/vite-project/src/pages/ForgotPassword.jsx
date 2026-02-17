// ============================================
// src/pages/ForgotPassword.jsx
// ============================================
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, AlertCircle, Palette } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const { theme, themes, currentTheme, changeTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDebugInfo(null);
    setLoading(true);

    try {
      const res = await fetch("https://finalyearproject-t10v.onrender.com/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to send reset link");
      }

      const data = await res.json();
      
      // Handle debug mode response
      if (data.debug_mode && data.dev_token) {
        setDebugInfo({
          token: data.dev_token,
          link: data.reset_link,
          expiresIn: data.expires_in
        });
        
        console.log("\n🔐 PASSWORD RESET DEBUG INFO");
        console.log("================================");
        console.log("Token:", data.dev_token);
        console.log("Link:", data.reset_link);
        console.log("Expires in:", data.expires_in);
        console.log("================================\n");
      }
      
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full">
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-3xl p-8 ${theme.colors.shadow}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              
              <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-3`}>Check Your Email</h2>
              
              <p className={`${theme.colors.textSecondary} mb-6`}>
                If an account exists with <strong className={theme.colors.textPrimary}>{email}</strong>, 
                you'll receive a password reset link shortly.
              </p>

              {/* Debug Mode Info */}
              {debugInfo && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-200 font-semibold mb-1">Development Mode Active</p>
                      <p className="text-yellow-200/80 text-sm">
                        In production, this link will be sent via email.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-yellow-200/60 text-xs mb-1">Reset Link:</p>
                      <a 
                        href={debugInfo.link}
                        className="text-yellow-300 text-sm break-all hover:text-yellow-200 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {debugInfo.link}
                      </a>
                    </div>
                    
                    <div>
                      <p className="text-yellow-200/60 text-xs mb-1">Token (also in console):</p>
                      <code className="block bg-black/20 text-yellow-300 text-xs p-2 rounded break-all">
                        {debugInfo.token}
                      </code>
                    </div>
                    
                    <p className="text-yellow-200/80 text-xs">
                      ⏱️ Expires in: <strong>{debugInfo.expiresIn}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Production Mode Info */}
              {!debugInfo && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <p className="text-blue-200 text-sm">
                    📧 Check your inbox and spam folder for the reset email.
                  </p>
                </div>
              )}

              <Link
                to="/login"
                className={`inline-flex items-center gap-2 ${theme.colors.accent} hover:underline font-semibold transition-colors`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
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
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className={`text-3xl font-bold ${theme.colors.textPrimary} mb-2`}>Forgot Password?</h1>
            <p className={theme.colors.textSecondary}>
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block ${theme.colors.textPrimary} font-semibold mb-2`}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-400 ${theme.colors.borderFocus} outline-none transition-all`}
              />
            </div>

            {error && (
              <div className={`${theme.colors.btnDanger} rounded-xl p-4 flex items-start gap-2`}>
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-6 py-3 ${theme.colors.btnPrimary} rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={theme.colors.textSecondary}>
              Remember your password?{" "}
              <Link to="/login" className={`${theme.colors.accent} hover:underline font-semibold transition-colors`}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
