// src/pages/FlexYourBrain/FlexYourBrainDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import {
  Brain,
  Crown,
  Flame,
  Target,
  BarChart3,
  BookOpen,
  Zap,
  Trophy,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
  Calendar,
  ArrowRight,
  Users,
  Activity,
  Home,
  LogOut,
  User,
  Settings,
  Rocket,
  Play,
  FileText,
  BarChart,
  Sparkles
} from 'lucide-react';
import { getAIQuestionStats, getAIDomains, startAIPracticeSession } from '../../utils/api';

const API_BASE_URL = "http://127.0.0.1:8000";

export default function FlexYourBrainDashboard() {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const [aiStats, setAiStats] = useState(null);
  const [aiDomains, setAiDomains] = useState([]);

  const [stats, setStats] = useState({
    overallScore: 0,
    testsCompleted: 0,
    timeSpent: '0h 0m',
    currentRank: 0,
    streak: 0
  });



  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchAIData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = getToken();
      const [analyticsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/aptitude/analytics/overview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);

        // Update stats with real data
        setStats({
          overallScore: Math.round(analyticsData.overview.overall_accuracy) || 0,
          testsCompleted: analyticsData.overview.total_tests || 0,
          timeSpent: '35h 12m', // This would need a separate endpoint
          currentRank: 12, // This would need a separate endpoint
          streak: analyticsData.category_breakdown.reduce((max, cat) => Math.max(max, cat.current_streak), 0) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIData = async () => {
    try {
      const [statsData, domainsData] = await Promise.all([
        getAIQuestionStats(),
        getAIDomains()
      ]);
      setAiStats(statsData);
      setAiDomains(domainsData.domains || []);
    } catch (error) {
      console.error('Error fetching AI data:', error);
    }
  };

  // Handle navigation to different modules
  const handlePracticeDrill = async (category = null, difficulty = 'all', count = 10) => {
  console.log('🔧 handlePracticeDrill called with:', { category, difficulty, count });
  
  try {
    if (category) {
      console.log('🎯 Starting practice session with category:', category);
      // Start a practice session immediately with the selected category
      const session = await startAIPracticeSession(category, difficulty, count);
      console.log('✅ Practice session created:', session);
      
      navigate('/practice-drill', {
        state: {
          sessionData: session,
          preselectedCategory: category,
          preselectedDifficulty: difficulty,
          preselectedCount: count,
          fromDashboard: true
        }
      });
    } else {
      console.log('📋 Going to practice drill page without preselection');
      // No category specified - go to practice drill page to let user choose
      navigate('/practice-drill', {
        state: {
          fromDashboard: true
        }
      });
    }
  } catch (error) {
    console.error('❌ Error starting practice drill:', error);
    alert('Failed to start practice session: ' + error.message);
  }
};

  const handleMockTest = () => {
    navigate('/mock-test');
  };

  const handleSJTModule = () => {
    navigate('/sjt-module');
  };

  const handleAnalytics = () => {
    navigate('/flex-analytics');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Handle profile navigation
  const handleProfileNavigate = () => {
    navigate('/profile');
  };

  // Handle settings navigation
  const handleSettingsNavigate = () => {
    navigate('/settings');
  };

  // Navigate to Master Dashboard
  const handleMasterDashboard = () => {
    navigate('/master-dashboard');
  };

  // Quick start practice sessions
  const handleQuickStart = async (category, difficulty = 'all', count = 10) => {
    try {
      const session = await startAIPracticeSession(category, difficulty, count);
      navigate('/practice-drill', {
        state: {
          sessionData: session,
          preselectedCategory: category,
          preselectedDifficulty: difficulty,
          preselectedCount: count
        }
      });
    } catch (error) {
      console.error('Error starting AI practice:', error);
      alert('Failed to start practice session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </span>!
            </h1>
            <p className="text-gray-300">Flex your brain with aptitude challenges</p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Master Dashboard Button */}
            <button
              onClick={handleMasterDashboard}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm min-w-[100px]"
              title="Master Dashboard"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            {/* Analytics Button */}
            <button
              onClick={handleAnalytics}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm min-w-[100px]"
              title="Analytics"
            >
              <BarChart className="w-5 h-5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>

            {/* Profile Button */}
            <button
              onClick={handleProfileNavigate}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm min-w-[100px]"
              title="Profile"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">Profile</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={handleSettingsNavigate}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm min-w-[100px]"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>


            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all border border-red-500/30 flex items-center gap-2 text-sm min-w-[100px]"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>


          </div>
        </div>

        {/* Stats Cards - UPDATED WITH 5 COLUMNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Overall Score Card */}
          <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-xl border border-pink-400/50 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm mb-1">Overall Score</p>
                <p className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
                  {stats.overallScore}%
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Tests Completed Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm mb-1">Tests Completed</p>
                <p className="text-3xl sm:text-4xl font-bold text-cyan-400">{stats.testsCompleted}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>


          {/* Current Streak Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm mb-1">Current Streak</p>
                <p className="text-3xl sm:text-4xl font-bold text-cyan-400">{stats.streak} days</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>


        </div>


        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => handlePracticeDrill()}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-400/50 rounded-2xl p-6 hover:scale-105 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Practice Drills</h3>
                <p className="text-gray-300 text-sm">Category-wise practice sessions</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleMockTest}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-400/50 rounded-2xl p-6 hover:scale-105 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Mock Test</h3>
                <p className="text-gray-300 text-sm">60-minute timed assessment</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleSJTModule}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-400/50 rounded-2xl p-6 hover:scale-105 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">SJT Module</h3>
                <p className="text-gray-300 text-sm">Situational judgment tests</p>
              </div>
            </div>
          </button>
        </div>

        {/* Performance Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Overview */}
          <div className="bg-white/10 backdrop-blur-xl border border-cyan-400/30 rounded-3xl p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-purple-400" />
              Performance Overview
            </h2>

            {analytics && analytics.category_breakdown.length > 0 ? (
              <div className="space-y-4">
                {analytics.category_breakdown.map((category, index) => (
                  <div key={index} className="bg-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-semibold">{category.category}</span>
                      <span className="text-2xl font-bold text-cyan-400">{category.accuracy}%</span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>{category.total_tests} tests</span>
                      <span>Best: {category.best_score}%</span>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                        style={{ width: `${category.accuracy}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Avg time: {category.avg_time_per_question}s</span>
                      <span>Streak: {category.current_streak} days</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No performance data yet</p>
                <p className="text-gray-500 text-sm mt-2">Complete your first practice session to see analytics</p>
              </div>
            )}
          </div>

          {/* Recent Activity & Quick Start */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-xl border border-cyan-400/30 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Recent Activity</h2>
                <button
                  onClick={handleAnalytics}
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {analytics && analytics.recent_tests.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recent_tests.slice(0, 4).map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm sm:text-base truncate">
                          {test.category} {test.test_type}
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {test.completed_at ? new Date(test.completed_at).toLocaleDateString() : 'In progress'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl sm:text-2xl font-bold ${test.score >= 80 ? 'text-green-400' :
                          test.score >= 60 ? 'text-yellow-400' : 'text-cyan-400'
                          }`}>
                          {test.score}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-gray-500 text-sm mt-2">Start practicing to see your activity here</p>
                </div>
              )}
            </div>

            {/* Quick Start Practice - UPDATED */}
            <div className="bg-white/10 backdrop-blur-xl border border-cyan-400/30 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Quick Start Practice
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { category: 'Logical', difficulty: 'easy', count: 10, color: 'bg-purple-500/20', border: 'border-purple-400/50' },
                  { category: 'Quantitative', difficulty: 'medium', count: 15, color: 'bg-blue-500/20', border: 'border-blue-400/50' },
                  { category: 'Verbal', difficulty: 'all', count: 20, color: 'bg-yellow-500/20', border: 'border-yellow-400/50' },
                  { category: 'Coding', difficulty: 'hard', count: 10, color: 'bg-green-500/20', border: 'border-green-400/50' }
                ].map((quickStart, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickStart(quickStart.category, quickStart.difficulty, quickStart.count)}
                    className={`p-3 ${quickStart.color} hover:opacity-90 border ${quickStart.border} rounded-xl transition-all group`}
                  >
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm mb-1">
                        {quickStart.category} ({quickStart.count} Qs)
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-xs">{quickStart.difficulty}</span>
                        <span className="text-yellow-400 text-xs font-bold">{quickStart.xp}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Practice Categories Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">📚</span>
            Practice Categories
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: 'logical',
                name: 'Logical Reasoning',
                displayName: 'Logical Reasoning',
                backendName: 'Logical',
                icon: Target,
                tests: 15,
                color: 'from-pink-500 to-purple-500',
                bgGlow: 'bg-pink-500/20',
                border: 'border-pink-400/50',
                description: 'Patterns, sequences, and logical puzzles'
              },
              {
                id: 'quantitative',
                name: 'Quantitative Aptitude',
                displayName: 'Quantitative Aptitude',
                backendName: 'Quantitative',
                icon: BarChart3,
                tests: 15,
                color: 'from-blue-500 to-cyan-500',
                bgGlow: 'bg-blue-500/20',
                border: 'border-blue-400/50',
                description: 'Math, percentages, and problem solving'
              },
              {
                id: 'verbal',
                name: 'Verbal Ability',
                displayName: 'Verbal Ability',
                backendName: 'Verbal',
                icon: BookOpen,
                tests: 15,
                color: 'from-yellow-500 to-orange-500',
                bgGlow: 'bg-yellow-500/20',
                border: 'border-yellow-400/50',
                description: 'Vocabulary, comprehension, and grammar'
              },
              {
                id: 'coding',
                name: 'Coding Challenge',
                displayName: 'Coding Challenge',
                backendName: 'Coding',
                icon: Zap,
                tests: 15,
                color: 'from-green-500 to-emerald-500',
                bgGlow: 'bg-green-500/20',
                border: 'border-green-400/50',
                description: 'Algorithms and programming concepts'
              }
            ].map((category) => {
              const Icon = category.icon;
              // Match using backend name
              const categoryStats = analytics?.category_breakdown.find(cat => cat.category === category.backendName);

              return (
                <div
                  key={category.id}
                  className={`relative bg-gradient-to-br ${category.color}/20 backdrop-blur-xl border ${category.border} rounded-3xl p-6 cursor-pointer hover:scale-105 transition-all overflow-hidden group`}
                  onClick={() => handlePracticeDrill(category.backendName)}
                >
                  <div className={`absolute -top-10 -right-10 w-32 h-32 ${category.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                  <div className="relative z-10">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-4`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{category.name}</h3>
                    <p className="text-gray-300 text-xs sm:text-sm mb-2">{category.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 text-xs">{category.tests} Tests</span>
                      {categoryStats && (
                        <span className="text-cyan-400 text-sm font-semibold">
                          {categoryStats.accuracy}%
                        </span>
                      )}
                    </div>

                    <button className={`w-full px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r ${category.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2`}>
                      <Play className="w-4 h-4" />
                      Practice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}