// frontend/vite-project/src/pages/FlexYourBrain/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Award,
  Clock,
  Users
} from 'lucide-react';

const API_BASE_URL = "https://finalyearproject-t10v.onrender.com";

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/aptitude/analytics/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">No analytics data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/flex-dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
          <div className="w-20"></div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tests</p>
                <p className="text-3xl font-bold text-white">{analytics.overview.total_tests}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Overall Accuracy</p>
                <p className="text-3xl font-bold text-white">{analytics.overview.overall_accuracy}%</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Questions Attempted</p>
                <p className="text-3xl font-bold text-white">{analytics.overview.total_questions_attempted}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Best Category</p>
                <p className="text-3xl font-bold text-white">{analytics.overview.best_category}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              Category Performance
            </h2>
            
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
          </div>

          {/* Recent Activity & Streak */}
          <div className="space-y-6">
            {/* Streak Info */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-400" />
                Current Streak
              </h2>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {analytics.category_breakdown.reduce((max, cat) => Math.max(max, cat.current_streak), 0)}
                </div>
                <p className="text-gray-400">days in a row</p>
                
                <div className="mt-4 p-3 bg-green-500/10 rounded-2xl">
                  <p className="text-green-400 text-sm">
                    Keep going! Consistency is key to improvement.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Tests */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-400" />
                Recent Tests
              </h2>
              
              <div className="space-y-3">
                {analytics.recent_tests.slice(0, 5).map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-semibold text-sm">{test.category}</p>
                      <p className="text-gray-400 text-xs">{test.test_type}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        test.score >= 80 ? 'text-green-400' : 
                        test.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {test.score}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvement Tips */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                Improvement Tips
              </h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <p className="text-blue-400 text-sm">
                    Focus on your weakest category for maximum improvement.
                  </p>
                </div>
                
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <p className="text-green-400 text-sm">
                    Practice daily to maintain your streak and build consistency.
                  </p>
                </div>
                
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <p className="text-purple-400 text-sm">
                    Review incorrect answers to learn from mistakes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}