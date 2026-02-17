// src/pages/MasterDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Brain, Target, Briefcase, Mic, ArrowRight, User, Settings, LogOut,
  Crown, Sparkles, Zap, Trophy, Star
} from 'lucide-react';

export default function MasterDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  
  // User level and progress
  const [userProfile, setUserProfile] = useState({
    level: 12,
    title: 'Career Architect',
    progress: 68,
    motivationalText: 'Your dream job is waiting. Keep building.'
  });

  // Motivational quotes that rotate
  const motivationalQuotes = [
    {
      text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
      icon: <Trophy className="w-6 h-6" />
    },
    {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      text: "Opportunities don't happen. You create them.",
      author: "Chris Grosser",
      icon: <Zap className="w-6 h-6" />
    },
    {
      text: "Your limitation—it's only your imagination.",
      author: "Unknown",
      icon: <Star className="w-6 h-6" />
    }
  ];

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Smooth quote rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length);
        setIsTransitioning(false);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, [motivationalQuotes.length]);

  const navigateToInterview = () => navigate('/interview-dashboard');
  const navigateToAptitude = () => navigate('/flex-dashboard');
  const navigateToCareer = () => navigate('/career-dashboard');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileNavigate = () => {
    navigate('/profile');
  };

  const handleSettingsNavigate = () => {
    navigate('/settings');
  };

  // Manual quote navigation
  const goToQuote = (index) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentQuoteIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} p-4 sm:p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${theme.colors.textPrimary} mb-2`}>
              <span className={theme.colors.accent}>
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </span>, Welcome to SkillBridge!
            </h1>
            <p className={`${theme.colors.textSecondary} text-sm sm:text-base lg:text-lg`}>Master your career with AI-powered tools</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <button 
              onClick={handleProfileNavigate}
              className={`px-3 sm:px-4 py-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} transition-colors flex items-center gap-2 text-sm sm:text-base`}
              title="Profile"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            
            <button 
              onClick={handleSettingsNavigate}
              className={`px-3 sm:px-4 py-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} transition-colors flex items-center gap-2 text-sm sm:text-base`}
              title="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            
            <button 
              onClick={handleLogout}
              className={`px-3 sm:px-4 py-2 ${theme.colors.btnDanger} rounded-lg transition-all flex items-center gap-2 text-sm sm:text-base`}
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Motivational Quote Banner */}
        <div className={`relative ${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 overflow-hidden ${theme.colors.shadow}`}>
          {/* Animated Background Elements */}
          <div className={`absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 ${theme.colors.decorativeBg1} rounded-full blur-3xl animate-pulse opacity-30`}></div>
          <div className={`absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 ${theme.colors.decorativeBg2} rounded-full blur-3xl animate-pulse opacity-30`} style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10">
            {/* Quote Content with Smooth Transition */}
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {/* Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  {motivationalQuotes[currentQuoteIndex].icon}
                </div>
                
                {/* Quote Text */}
                <div className="flex-1">
                  <p className={`${theme.colors.textPrimary} text-lg sm:text-xl lg:text-2xl font-semibold mb-2 leading-relaxed`}>
                    "{motivationalQuotes[currentQuoteIndex].text}"
                  </p>
                  <p className={`${theme.colors.accent} text-sm sm:text-base lg:text-lg`}>
                    — {motivationalQuotes[currentQuoteIndex].author}
                  </p>
                </div>
              </div>
            </div>

            {/* Indicator Dots */}
            <div className="flex gap-2 justify-center mt-6">
              {motivationalQuotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuote(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentQuoteIndex
                      ? `${theme.colors.accentBg} w-8 h-2`
                      : `${theme.colors.bgGlass} w-2 h-2 hover:${theme.colors.bgCard}`
                  }`}
                  aria-label={`Go to quote ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* All Cards Grid - Uniform Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* 1. Profile Badge Card */}
          <div 
            className={`relative ${theme.colors.bgCard} backdrop-blur-xl border-2 ${theme.colors.border} rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform group h-full ${theme.colors.shadow}`}
            onClick={handleProfileNavigate}
          >
            {/* Background Glow Effects */}
            <div className={`absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 ${theme.colors.decorativeBg1} rounded-full blur-3xl opacity-30`}></div>
            <div className={`absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 ${theme.colors.decorativeBg2} rounded-full blur-3xl opacity-30`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Top Section: Profile Info */}
              <div className="flex-1">
                <div className="flex items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="relative flex-shrink-0">
                    {/* Crown Icon on Top */}
                    <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2">
                      <Crown className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400 fill-yellow-400/50" />
                    </div>
                    
                    {/* Avatar Circle with Gradient Border */}
                    <div className="relative">
                      <div className={`absolute inset-0 ${theme.colors.btnPrimary} rounded-full blur-sm`}></div>
                      <div className={`relative w-20 h-20 sm:w-28 sm:h-28 ${theme.colors.bgCard} rounded-full flex items-center justify-center border-4 ${theme.colors.borderLight} backdrop-blur-xl`}>
                        <User className={`w-10 h-10 sm:w-14 sm:h-14 ${theme.colors.textPrimary}`} />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 pt-1 sm:pt-2 min-w-0">
                    <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${theme.colors.textPrimary} mb-1 truncate`}>
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </h2>
                    <p className={`${theme.colors.textSecondary} text-sm sm:text-base lg:text-lg mb-2 sm:mb-3`}>
                      Level {userProfile.level}: {userProfile.title}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className={`w-full ${theme.colors.progressTrack} rounded-full h-2 sm:h-3 overflow-hidden backdrop-blur-sm`}>
                        <div 
                          className={`h-full ${theme.colors.progressBg} rounded-full transition-all duration-500 relative`}
                          style={{ width: `${userProfile.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <p className={`text-xs ${theme.colors.textSecondary} mt-1`}>{userProfile.progress}% to next level</p>
                    </div>
                  </div>
                </div>

                {/* Motivational Text */}
                <p className={`${theme.colors.textSecondary} text-sm sm:text-base mb-4 sm:mb-6 italic`}>
                  "{userProfile.motivationalText}"
                </p>
              </div>

              {/* Bottom Section: Button */}
              <button className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 ${theme.colors.btnSecondary} font-semibold rounded-xl transition-all backdrop-blur-sm flex items-center justify-center gap-2 group-hover:${theme.colors.bgCard} text-sm sm:text-base`}>
                View Full Profile
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 2. InterviewIQ Card */}
          <div 
            className={`relative ${theme.colors.bgCard} backdrop-blur-xl border-2 ${theme.colors.border} rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform h-full ${theme.colors.shadow}`}
            onClick={navigateToInterview}
          >
            <div className={`absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 ${theme.colors.decorativeBg1} rounded-full blur-3xl opacity-30`}></div>
            <div className={`absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 ${theme.colors.decorativeBg2} rounded-full blur-3xl opacity-30`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Top Section: Title */}
              <div className="flex-1">
                <p className={`${theme.colors.accent} text-xs sm:text-sm font-semibold mb-2`}>Primary Module:</p>
                
                <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${theme.colors.btnPrimary} rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className={`text-2xl sm:text-3xl font-bold ${theme.colors.textPrimary} mb-1`}>InterviewIQ</h2>
                    <p className={`${theme.colors.textSecondary} text-xs sm:text-sm`}>Master your interview skills with AI-powered feedback</p>
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-2 sm:space-y-3">
                  <div className={`flex items-center gap-3 p-2.5 sm:p-3 ${theme.colors.bgGlass} rounded-lg sm:rounded-xl border ${theme.colors.borderLight}`}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${theme.colors.bgCard} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Mic className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.colors.accent}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`${theme.colors.textPrimary} font-semibold text-xs sm:text-sm`}>Audio & Video Analysis</p>
                      <p className={`${theme.colors.textMuted} text-xs`}>Real-time feedback on speech and body language</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 p-2.5 sm:p-3 ${theme.colors.bgGlass} rounded-lg sm:rounded-xl border ${theme.colors.borderLight}`}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${theme.colors.bgCard} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Brain className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.colors.accent}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`${theme.colors.textPrimary} font-semibold text-xs sm:text-sm`}>AI-Powered Insights</p>
                      <p className={`${theme.colors.textMuted} text-xs`}>Detailed analysis of your performance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Buttons */}
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button className={`flex-1 px-3 sm:px-6 py-2.5 sm:py-3 ${theme.colors.btnPrimary} rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-xs sm:text-base`}>
                  Start Practice
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button className={`px-4 sm:px-6 py-2.5 sm:py-3 ${theme.colors.btnSecondary} rounded-lg sm:rounded-xl transition-all text-xs sm:text-base`}>
                  History
                </button>
              </div>
            </div>
          </div>

          {/* 3. FlexYourBrain Card */}
          <div 
            className={`relative ${theme.colors.bgCard} backdrop-blur-xl border-2 ${theme.colors.border} rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer h-full ${theme.colors.shadow}`}
            onClick={navigateToAptitude}
          >
            <div className={`absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 ${theme.colors.decorativeBg3} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Top Section: Title */}
              <div className="flex-1">
                <p className="text-blue-400 text-xs sm:text-sm font-semibold mb-2">Module 2:</p>
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-xl sm:text-2xl font-bold ${theme.colors.textPrimary}`}>FlexYourBrain</h3>
                    <p className={`${theme.colors.textSecondary} text-xs sm:text-sm`}>Sharpen your aptitude & cognitive skills</p>
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 ${theme.colors.textSecondary} text-xs sm:text-sm`}>
                    <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                    <span>Logical Reasoning Tests</span>
                  </div>
                  <div className={`flex items-center gap-2 ${theme.colors.textSecondary} text-xs sm:text-sm`}>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                    <span>Quantitative Aptitude</span>
                  </div>
                  <div className={`flex items-center gap-2 ${theme.colors.textSecondary} text-xs sm:text-sm`}>
                    <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                    <span>Verbal Ability Drills</span>
                  </div>
                  <div className={`flex items-center gap-2 ${theme.colors.textSecondary} text-xs sm:text-sm`}>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                    <span>Coding Challenges</span>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Buttons */}
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm">
                  Practice Drills
                </button>
                <button className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 ${theme.colors.btnSecondary} rounded-lg transition-all text-xs sm:text-sm`}>
                  Mock Tests
                </button>
              </div>
            </div>
          </div>

          {/* 4. CareerCrush Card */}
          <div 
            className={`relative ${theme.colors.bgCard} backdrop-blur-xl border-2 ${theme.colors.border} rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer h-full ${theme.colors.shadow}`}
            onClick={navigateToCareer}
          >
            <div className={`absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 ${theme.colors.decorativeBg3} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Top Section: Title */}
              <div className="flex-1">
                <p className="text-green-400 text-xs sm:text-sm font-semibold mb-2">Module 3:</p>
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-xl sm:text-2xl font-bold ${theme.colors.textPrimary}`}>CareerCrush</h3>
                    <p className={`${theme.colors.textSecondary} text-xs sm:text-sm`}>Optimize your career documents with AI</p>
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 ${theme.colors.textSecondary} text-xs sm:text-sm`}>
                    <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                    <span>ATS-Optimized Resume Analysis</span>
                  </div>
                  <div className={`flex items-center gap-2 ${theme.colors.textSecondary} text-xs sm:text-sm`}>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></div>
                    <span>AI Cover Letter Generator</span>
                  </div>
                  <div className={`flex items-center gap-2 ${theme.colors.textSecondary} text-xs sm:text-sm`}>
                    <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                    <span>Keyword Optimization</span>
                  </div>
                  <div className={`flex items-center gap-2 ${theme.colors.textSecondary} text-xs sm:text-sm`}>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></div>
                    <span>Industry-Specific Templates</span>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Buttons */}
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm">
                  Review Resume
                </button>
                <button className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 ${theme.colors.btnSecondary} rounded-lg transition-all text-xs sm:text-sm`}>
                  Generate Letter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}