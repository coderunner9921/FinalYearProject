import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    interviewsCompleted: 0,
    currentLevel: 1,
    badgesEarned: 0,
    averageScore: 0
  });
  const location = useLocation();

  useEffect(() => {
    fetchDomains();
    // Check for completion message from interview
    if (location.state?.message) {
      alert(location.state.message);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchDomains = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/questions/domains/');
      setDomains(response.data.domains);
      
      // Simulate some stats for demo (in Phase 4, this will come from backend)
      setStats({
        interviewsCompleted: Math.floor(Math.random() * 10),
        currentLevel: Math.floor(Math.random() * 5) + 1,
        badgesEarned: Math.floor(Math.random() * 8),
        averageScore: parseFloat((Math.random() * 3 + 7).toFixed(1)) // 7.0 - 10.0
      });
    } catch (error) {
      console.error('Error fetching domains:', error);
      setError('Failed to load interview domains. Please check if the backend server is running.');
      
      // Fallback domains in case API fails
      setDomains(['HR', 'Technical', 'Marketing', 'Sales', 'General']);
    } finally {
      setLoading(false);
    }
  };

  const getDomainIcon = (domain) => {
    const icons = {
      'HR': '👥',
      'Technical': '💻', 
      'Marketing': '📈',
      'Sales': '💰',
      'General': '🎯'
    };
    return icons[domain] || '🎤';
  };

  const getDomainDescription = (domain) => {
    const descriptions = {
      'HR': 'Practice behavioral questions, communication skills, and situational responses',
      'Technical': 'Technical interviews covering programming, algorithms, and system design',
      'Marketing': 'Marketing strategy, campaign analysis, and business development questions',
      'Sales': 'Sales techniques, customer relationships, and negotiation scenarios',
      'General': 'General interview questions suitable for all types of positions'
    };
    return descriptions[domain] || 'Practice interview questions with AI-powered feedback';
  };

  const getDomainColor = (domain) => {
    const colors = {
      'HR': 'from-purple-500 to-purple-600',
      'Technical': 'from-blue-500 to-blue-600',
      'Marketing': 'from-green-500 to-green-600',
      'Sales': 'from-orange-500 to-orange-600',
      'General': 'from-gray-500 to-gray-600'
    };
    return colors[domain] || 'from-blue-500 to-blue-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading your interview dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">SkillBridge</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Master your interview skills with AI-powered mock interviews. 
              Get instant feedback on your communication, content, and confidence.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-8">
              <div className="bg-white/60 backdrop-blur rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">{stats.interviewsCompleted}</div>
                <div className="text-sm text-gray-600">Interviews Done</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-green-600">Level {stats.currentLevel}</div>
                <div className="text-sm text-gray-600">Your Level</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">{stats.badgesEarned}</div>
                <div className="text-sm text-gray-600">Badges</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-orange-600">{stats.averageScore}/10</div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        )}

        {/* Interview Domains Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Choose Your Interview Domain
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {domains.map((domain) => (
              <div 
                key={domain} 
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${getDomainColor(domain)}`}></div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{getDomainIcon(domain)}</span>
                    <h3 className="text-2xl font-semibold text-gray-800 capitalize">
                      {domain} Interview
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {getDomainDescription(domain)}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      AI-powered speech analysis
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Real-time feedback
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Progress tracking
                    </div>
                  </div>

                  <Link
                    to={`/interview/${domain.toLowerCase()}`}
                    className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    Start Practice Session
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎙️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Record Your Answer</h3>
              <p className="text-gray-600">
                Use your microphone to record responses to interview questions
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">2. AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes your speech, content, grammar, and confidence
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Get Feedback</h3>
              <p className="text-gray-600">
                Receive detailed scores and improvement suggestions
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity / Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Tips */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">💡</span> Interview Tips
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm font-bold">1</span>
                </div>
                <p className="text-gray-700">
                  <strong>Speak clearly and confidently</strong> - Practice your pacing and avoid filler words
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm font-bold">2</span>
                </div>
                <p className="text-gray-700">
                  <strong>Structure your answers</strong> - Use the STAR method (Situation, Task, Action, Result)
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm font-bold">3</span>
                </div>
                <p className="text-gray-700">
                  <strong>Be authentic</strong> - Share genuine experiences and show your personality
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm font-bold">4</span>
                </div>
                <p className="text-gray-700">
                  <strong>Practice regularly</strong> - Consistent practice builds confidence and improves performance
                </p>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Improve?</h3>
            <p className="mb-6 opacity-90">
              Start with any domain above. Each practice session includes 3-5 questions with comprehensive AI feedback.
            </p>
            <div className="space-y-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>No registration required</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Completely free forever</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant AI feedback</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;