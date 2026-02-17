// src/pages/Welcome.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  Sparkles, ArrowRight, CheckCircle, Brain, Target, Zap,
  FileText, Trophy, Rocket, Mic, BarChart3, Users, Award,
  TrendingUp, BookOpen, Lightbulb, Video, Clock, Palette
} from "lucide-react";

export default function Welcome() {
  const { isAuthenticated } = useAuth();
  const { theme, themes, currentTheme, changeTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary}`}>
      {/* Header */}
      <header className={`border-b ${theme.colors.borderLight} backdrop-blur-xl ${theme.colors.bgGlass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${theme.colors.btnPrimary} rounded-xl flex items-center justify-center`}>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${theme.colors.textPrimary}`}>SkillBridge</h1>
                <p className={`text-xs ${theme.colors.accent}`}>AI-Powered Career Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Selector */}
              <div className="relative group">
                <button className={`p-2 sm:p-2.5 ${theme.colors.bgCard} border ${theme.colors.borderLight} rounded-xl ${theme.colors.cardHover} transition-all`}>
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

              <Link to="/login" className={`px-3 sm:px-6 py-2 sm:py-2.5 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} font-semibold transition-colors text-sm sm:text-base`}>
                Login
              </Link>
              <Link to="/signup" className={`px-3 sm:px-6 py-2 sm:py-2.5 ${theme.colors.btnPrimary} rounded-xl transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base ${theme.colors.shadow}`}>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 ${theme.colors.bgCard} border ${theme.colors.borderLight} rounded-full mb-6 backdrop-blur-xl`}>
            <Zap className={`w-4 h-4 ${theme.colors.accent}`} />
            <span className={`text-sm ${theme.colors.textSecondary} font-semibold`}>Complete Career Preparation Suite</span>
          </div>

          <h1 className={`text-4xl sm:text-5xl md:text-7xl font-bold ${theme.colors.textPrimary} mb-6 leading-tight`}>
            Master Your
            <span className={`block ${theme.colors.accent} mt-2`}>
              Career Journey
            </span>
          </h1>

          <p className={`text-lg sm:text-xl ${theme.colors.textSecondary} mb-10 max-w-2xl mx-auto leading-relaxed`}>
            Everything you need to succeed in today's competitive job market - from interview prep to aptitude training and career document optimization.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 ${theme.colors.btnPrimary} rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3`}>
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 ${theme.colors.btnSecondary} rounded-xl transition-all flex items-center justify-center gap-3`}>
              <Video className="w-5 h-5" />
              Try Demo Interview
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 max-w-2xl mx-auto">
            <div className="text-center">
              <p className={`text-3xl sm:text-4xl font-bold ${theme.colors.accent}`}>10K+</p>
              <p className={`${theme.colors.textMuted} text-xs sm:text-sm mt-1`}>Practice Sessions</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl sm:text-4xl font-bold ${theme.colors.accent}`}>95%</p>
              <p className={`${theme.colors.textMuted} text-xs sm:text-sm mt-1`}>Success Rate</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl sm:text-4xl font-bold ${theme.colors.accent}`}>8+</p>
              <p className={`${theme.colors.textMuted} text-xs sm:text-sm mt-1`}>Domains</p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Modules */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className={`text-3xl sm:text-4xl font-bold ${theme.colors.textPrimary} text-center mb-4`}>
          Complete Career Enhancement Suite
        </h2>
        <p className={`${theme.colors.textSecondary} text-center mb-8 sm:mb-12 max-w-2xl mx-auto`}>
          Three powerful modules to help you succeed at every stage
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* InterviewIQ */}
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-2xl p-6 sm:p-8 ${theme.colors.cardHover} transition-all ${theme.colors.shadow}`}>
            <div className={`w-12 h-12 sm:w-14 sm:h-14 ${theme.colors.btnPrimary} rounded-xl flex items-center justify-center mb-4 sm:mb-6`}>
              <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className={`text-xl sm:text-2xl font-bold ${theme.colors.textPrimary} mb-3`}>InterviewIQ</h3>
            <p className={`${theme.colors.textSecondary} mb-4 text-sm sm:text-base leading-relaxed`}>
              Practice mock interviews with AI-powered feedback on clarity, confidence, grammar, and pacing.
            </p>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme.colors.accent}`}>
                <Trophy className="w-4 h-4" />
                <span>AI Feedback & Scoring</span>
              </div>
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme.colors.accent}`}>
                <BarChart3 className="w-4 h-4" />
                <span>Detailed Analytics</span>
              </div>
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme.colors.accent}`}>
                <FileText className="w-4 h-4" />
                <span>PDF Reports</span>
              </div>
            </div>
          </div>

          {/* FlexYourBrain */}
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-2xl p-6 sm:p-8 ${theme.colors.cardHover} transition-all ${theme.colors.shadow}`}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className={`text-xl sm:text-2xl font-bold ${theme.colors.textPrimary} mb-3`}>FlexYourBrain</h3>
            <p className={`${theme.colors.textSecondary} mb-4 text-sm sm:text-base leading-relaxed`}>
              Prepare for aptitude tests with practice drills and mock exams across multiple domains.
            </p>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Logical Reasoning</span>
              </div>
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Quantitative Aptitude</span>
              </div>
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                <Lightbulb className="w-4 h-4 text-cyan-400" />
                <span>Cognitive Challenges</span>
              </div>
            </div>
          </div>

          {/* CareerCrush */}
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-2xl p-6 sm:p-8 ${theme.colors.cardHover} transition-all ${theme.colors.shadow}`}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className={`text-xl sm:text-2xl font-bold ${theme.colors.textPrimary} mb-3`}>CareerCrush</h3>
            <p className={`${theme.colors.textSecondary} mb-4 text-sm sm:text-base leading-relaxed`}>
              Optimize your career documents with AI analysis for resumes and cover letters.
            </p>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                <Users className="w-4 h-4 text-emerald-400" />
                <span>ATS Score Analysis</span>
              </div>
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Application Tracking</span>
              </div>
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme.colors.textSecondary}`}>
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Resume Optimization</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2 className={`text-3xl sm:text-4xl font-bold ${theme.colors.textPrimary} text-center mb-4`}>
          Why Choose SkillBridge?
        </h2>
        <p className={`${theme.colors.textSecondary} text-center mb-8 sm:mb-12 max-w-2xl mx-auto`}>
          Our AI-powered platform gives you everything you need
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            { icon: Brain, title: 'AI-Powered Feedback', desc: 'Get instant, detailed feedback on clarity, confidence, grammar, pacing, and overall performance from our advanced AI engine.' },
            { icon: TrendingUp, title: 'Track Progress', desc: 'Monitor your improvement over time with detailed analytics and performance metrics across all modules.' },
            { icon: Target, title: 'Multiple Domains', desc: 'Practice for HR, Technical, Marketing, Finance, DSA interviews, and more with domain-specific questions and challenges.' }
          ].map((item, i) => (
            <div key={i} className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-2xl p-6 sm:p-8 ${theme.colors.cardHover} transition-all ${theme.colors.shadow}`}>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 ${theme.colors.bgCard} rounded-xl flex items-center justify-center mb-4 sm:mb-6 border ${theme.colors.borderLight}`}>
                <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${theme.colors.accent}`} />
              </div>
              <h3 className={`text-xl sm:text-2xl font-bold ${theme.colors.textPrimary} mb-3`}>{item.title}</h3>
              <p className={`${theme.colors.textSecondary} text-sm sm:text-base leading-relaxed`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2 className={`text-3xl sm:text-4xl font-bold ${theme.colors.textPrimary} text-center mb-4`}>How It Works</h2>
        <p className={`${theme.colors.textSecondary} text-center mb-8 sm:mb-12 max-w-2xl mx-auto`}>Get started in three simple steps</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            { num: '1', title: 'Choose Your Path', desc: 'Select from InterviewIQ, FlexYourBrain, or CareerCrush based on your current needs' },
            { num: '2', title: 'Practice & Learn', desc: 'Engage with our interactive modules and receive immediate AI-powered feedback' },
            { num: '3', title: 'Improve & Succeed', desc: 'Track your progress, implement feedback, and land your dream job' }
          ].map((step) => (
            <div key={step.num} className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-2xl p-6 sm:p-8 ${theme.colors.cardHover} transition-all ${theme.colors.shadow} text-center`}>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 ${theme.colors.btnPrimary} rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 ${theme.colors.shadow}`}>
                <span className="text-xl sm:text-2xl font-bold text-white">{step.num}</span>
              </div>
              <h3 className={`text-lg sm:text-xl font-bold ${theme.colors.textPrimary} mb-3`}>{step.title}</h3>
              <p className={`${theme.colors.textSecondary} text-sm sm:text-base leading-relaxed`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What You'll Get */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-3xl p-8 sm:p-12 ${theme.colors.shadow}`}>
          <div className="max-w-3xl mx-auto">
            <h2 className={`text-3xl sm:text-4xl font-bold ${theme.colors.textPrimary} text-center mb-8 sm:mb-12`}>What You'll Get</h2>

            <div className="space-y-6">
              {[
                { title: 'Comprehensive Feedback', desc: 'Detailed analysis of clarity, confidence, grammar, pacing, and sentiment across all modules' },
                { title: 'Downloadable Reports', desc: 'Get PDF reports with complete transcriptions, scores, and improvement tips' },
                { title: 'Progress Dashboard', desc: 'Track your improvement with visual analytics across all three modules' },
                { title: 'All-in-One Platform', desc: 'Access interview prep, aptitude training, and resume optimization in one place' },
                { title: 'Expert-Curated Content', desc: 'Questions and scenarios created by industry experts and hiring managers' },
                { title: 'Flexible Practice', desc: 'No scheduling needed - practice whenever and wherever you want' }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className={`text-lg sm:text-xl font-semibold ${theme.colors.textPrimary} mb-2`}>{feature.title}</h3>
                    <p className={`${theme.colors.textSecondary} text-sm sm:text-base leading-relaxed`}>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className={`${theme.colors.btnPrimary} rounded-3xl p-8 sm:p-12 text-center ${theme.colors.glow}`}>
          <Rocket className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4 sm:mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Launch Your Career?</h2>
          <p className="text-white/90 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of successful candidates who improved their skills with SkillBridge's comprehensive suite
          </p>
          <Link to="/signup" className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl">
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${theme.colors.borderLight} backdrop-blur-xl ${theme.colors.bgGlass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className={`${theme.colors.textMuted} text-xs sm:text-sm`}>© 2025 SkillBridge. All rights reserved.</p>
            <div className={`flex items-center gap-4 text-xs sm:text-sm ${theme.colors.textMuted}`}>
              <Link to="/privacy" className={`hover:${theme.colors.textPrimary} transition-colors`}>Privacy</Link>
              <Link to="/terms" className={`hover:${theme.colors.textPrimary} transition-colors`}>Terms</Link>
              <Link to="/contact" className={`hover:${theme.colors.textPrimary} transition-colors`}>Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}