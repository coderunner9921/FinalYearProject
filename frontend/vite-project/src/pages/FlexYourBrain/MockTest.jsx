// frontend/vite-project/src/pages/FlexYourBrain/MockTest.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Clock,
  Brain,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = "https://finalyearproject-t10v.onrender.com";

export default function MockTest() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [testSession, setTestSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    if (testSession && timeLeft > 0) {
      const countdown = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimer(countdown);
      return () => clearInterval(countdown);
    }
  }, [testSession, timeLeft]);

  const startMockTest = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/aptitude/mock-test/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categories: ['Logical', 'Quantitative', 'Verbal', 'Coding']
        })
      });

      if (!response.ok) throw new Error('Failed to start mock test');

      const data = await response.json();
      setTestSession(data);
      setCurrentQuestion(0);
      setUserAnswers({});
      setTimeLeft(data.time_limit);
    } catch (error) {
      console.error('Error starting mock test:', error);
      alert('Failed to start mock test');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const submitAnswer = (answer) => {
    if (!testSession) return;

    const newAnswers = {
      ...userAnswers,
      [currentQuestion]: {
        answer,
        questionId: testSession.questions[currentQuestion].id
      }
    };
    setUserAnswers(newAnswers);

    // Move to next question or complete test
    if (currentQuestion < testSession.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeTest();
    }
  };

  const completeTest = async () => {
    if (timer) clearInterval(timer);
    
    // Navigate to results page
    navigate('/test-results', { 
      state: { 
        testSession,
        userAnswers,
        timeSpent: 60 * 60 - timeLeft
      }
    });
  };

  if (!testSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/flex-dashboard')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-white">Mock Test</h1>
            <div className="w-20"></div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              60-Minute Aptitude Test
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-2xl font-bold text-white mb-2">50</div>
                <div className="text-gray-400">Questions</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-2xl font-bold text-white mb-2">60</div>
                <div className="text-gray-400">Minutes</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-2xl font-bold text-white mb-2">4</div>
                <div className="text-gray-400">Categories</div>
              </div>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-300">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Important:</span>
              </div>
              <p className="text-yellow-200 text-sm mt-2">
                Once started, the timer cannot be paused. The test will auto-submit when time expires.
              </p>
            </div>

            <button
              onClick={startMockTest}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              {loading ? 'Starting Test...' : 'Start Mock Test'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = testSession.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / testSession.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/flex-dashboard')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-white">
              <div className="font-semibold">Mock Test</div>
              <div className="text-sm text-gray-400">Question {currentQuestion + 1} of {testSession.questions.length}</div>
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            timeLeft < 300 ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/5 rounded-full h-3 mb-6">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                {question.category}
              </span>
              <span className="ml-3 px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </span>
            </div>
            <span className="text-gray-400 text-sm">
              {question.subcategory}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
            {question.question_text}
          </h2>

          {/* Options */}
          <div className="space-y-4">
            {question.options.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index);
              return (
                <button
                  key={index}
                  onClick={() => submitAnswer(optionLetter)}
                  className="w-full p-4 text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-semibold">
                      {optionLetter}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => currentQuestion > 0 && setCurrentQuestion(currentQuestion - 1)}
              disabled={currentQuestion === 0}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all disabled:opacity-50"
            >
              Previous
            </button>
            
            <button
              onClick={() => currentQuestion < testSession.questions.length - 1 ? setCurrentQuestion(currentQuestion + 1) : completeTest()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              {currentQuestion < testSession.questions.length - 1 ? 'Next' : 'Finish Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}