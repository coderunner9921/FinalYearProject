// frontend/vite-project/src/pages/FlexYourBrain/PracticeDrill.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { startAIPracticeSession } from "../../api/aptitude";

import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  BarChart3,
  BookOpen,
  Zap,
  Trophy,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:8000";

export default function PracticeDrill() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [testSession, setTestSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [timer, setTimer] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Category icons and colors
  const categoryConfig = {
    'Logical': { icon: Target, color: 'from-pink-500 to-purple-500', bgColor: 'bg-pink-500/20' },
    'Quantitative': { icon: BarChart3, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/20' },
    'Verbal': { icon: BookOpen, color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-500/20' },
    'Coding': { icon: Zap, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/20' }
  };

  // Map backend to frontend display names
  const mapBackendToFrontendCategory = (backendCategory) => {
    const mapping = {
      'Logical': 'Logical Reasoning',
      'Quantitative': 'Quantitative Aptitude',
      'Verbal': 'Verbal Ability',
      'Coding': 'Coding Challenge'
    };
    return mapping[backendCategory] || backendCategory;
  };

  // Map frontend to backend category names
  const mapFrontendToBackendCategory = (frontendCategory) => {
    const mapping = {
      'Logical Reasoning': 'Logical',
      'Quantitative Aptitude': 'Quantitative',
      'Verbal Ability': 'Verbal',
      'Coding Challenge': 'Coding'
    };
    return mapping[frontendCategory] || frontendCategory;
  };

  useEffect(() => {
    fetchCategories();

    // Check if category is preselected from URL
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      // Convert frontend URL param to backend category
      const backendCategory = mapFrontendToBackendCategory(categoryParam);
      setSelectedCategory(backendCategory);
    }
  }, [searchParams]);

    useEffect(() => {
    if (location.state?.sessionData) {
      // We have session data directly from the dashboard
      const { sessionData, preselectedCategory, preselectedDifficulty, preselectedCount } = location.state;
      setTestSession({
        ...sessionData,
        displayCategory: mapBackendToFrontendCategory(sessionData.category)
      });
      setSelectedCategory(preselectedCategory || '');
      setSelectedDifficulty(preselectedDifficulty || 'all');
      setQuestionCount(preselectedCount || 10);
      setCurrentQuestion(0);
      setUserAnswers({});
      setTimeSpent(0);
      setShowResults(false);
    } else {
      // Normal flow - check URL params
      const categoryParam = searchParams.get('category');
      if (categoryParam) {
        const backendCategory = mapFrontendToBackendCategory(categoryParam);
        setSelectedCategory(backendCategory);
      }
    }
  }, [location.state, searchParams]);

  useEffect(() => {
    if (testSession && !showResults) {
      // Start timer for the current question
      const questionTimer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);

      setTimer(questionTimer);

      return () => clearInterval(questionTimer);
    }
  }, [testSession, currentQuestion, showResults]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/aptitude/categories`);
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPracticeSession = async () => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      console.log('🚀 Starting practice session with:', {
        selectedCategory,
        selectedDifficulty,
        questionCount
      });

      const sessionData = await startAIPracticeSession(
        selectedCategory,
        selectedDifficulty,
        questionCount
      );

      console.log('📦 Session data received:', sessionData);

      if (!sessionData) {
        console.error('❌ No session data received');
        throw new Error('No data received from server');
      }

      if (!sessionData.questions || !Array.isArray(sessionData.questions)) {
        console.error('❌ Invalid session data format:', sessionData);
        throw new Error('Invalid response format from server');
      }

      if (sessionData.questions.length === 0) {
        console.error('❌ No questions in session');
        throw new Error('No questions received from server');
      }

      // Validate each question has required fields
      const validQuestions = sessionData.questions.every(q => 
        q && q.question_text && q.options && Array.isArray(q.options) && q.options.length === 4
      );

      if (!validQuestions) {
        console.error('❌ Some questions are invalid:', sessionData.questions);
        throw new Error('Invalid question format received');
      }

      setTestSession({
        ...sessionData,
        displayCategory: mapBackendToFrontendCategory(sessionData.category)
      });

      setCurrentQuestion(0);
      setUserAnswers({});
      setTimeSpent(0);
      setShowResults(false);
      setSubmittingAnswer(false);

    } catch (error) {
      console.error('❌ Error starting practice:', error);
      alert(error.message || 'Failed to start practice session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer) => {
    if (submittingAnswer || !testSession) return;
    
    setSubmittingAnswer(true);
    
    try {
      console.log('📤 Submitting answer:', {
        testId: testSession.test_id,
        questionId: testSession.questions[currentQuestion].id,
        answer,
        timeSpent
      });

      // Record answer locally first
      const newAnswers = {
        ...userAnswers,
        [currentQuestion]: {
          answer,
          timeSpent,
          questionId: testSession.questions[currentQuestion].id
        }
      };
      setUserAnswers(newAnswers);

      // Submit to backend
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/aptitude/practice/${testSession.test_id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: testSession.questions[currentQuestion].id,
          user_answer: answer,
          time_taken: timeSpent
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }

      const submitResult = await response.json();
      console.log('✅ Answer submitted successfully:', submitResult);

      // Check if this was the last question
      if (currentQuestion === testSession.questions.length - 1) {
        console.log('🏁 Last question answered, completing test...');
        setTimeout(() => {
          completePracticeSession();
        }, 500);
      } else {
        // Move to next question
        setCurrentQuestion(currentQuestion + 1);
        setTimeSpent(0);
        setSubmittingAnswer(false);
      }
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      setSubmittingAnswer(false);
      alert(`Failed to submit answer: ${error.message}`);
    }
  };

  const completePracticeSession = async () => {
    if (!testSession) return;

    try {
      console.log('📊 Completing practice session:', testSession.test_id);
      
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/aptitude/practice/${testSession.test_id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete practice session');
      }

      const data = await response.json();
      console.log('✅ Test completed successfully:', data);
      
      setResults(data);
      setShowResults(true);
      setSubmittingAnswer(false);
      
      // Clear timer
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
    } catch (error) {
      console.error('Error completing practice:', error);
      setSubmittingAnswer(false);
      alert('Failed to complete test: ' + error.message);
    }
  };

  const skipQuestion = () => {
    if (submittingAnswer) return;
    
    if (currentQuestion < testSession.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeSpent(0);
    } else {
      completePracticeSession();
    }
  };

  const getCategoryIcon = (category) => {
    const normalizedCategory = category?.includes('Logical') ? 'Logical' :
                              category?.includes('Quantitative') ? 'Quantitative' :
                              category?.includes('Verbal') ? 'Verbal' :
                              category?.includes('Coding') ? 'Coding' : category;
    
    const config = categoryConfig[normalizedCategory];
    if (!config) return Brain;
    return config.icon;
  };

  const getCategoryColor = (category) => {
    const normalizedCategory = category?.includes('Logical') ? 'Logical' :
                              category?.includes('Quantitative') ? 'Quantitative' :
                              category?.includes('Verbal') ? 'Verbal' :
                              category?.includes('Coding') ? 'Coding' : category;
    
    const config = categoryConfig[normalizedCategory];
    if (!config) return 'from-gray-500 to-gray-600';
    return config.color;
  };

  const getCategoryBgColor = (category) => {
    const normalizedCategory = category?.includes('Logical') ? 'Logical' :
                              category?.includes('Quantitative') ? 'Quantitative' :
                              category?.includes('Verbal') ? 'Verbal' :
                              category?.includes('Coding') ? 'Coding' : category;
    
    const config = categoryConfig[normalizedCategory];
    if (!config) return 'bg-gray-500/20';
    return config.bgColor;
  };

  if (loading && !testSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (showResults && results) {
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
            <h1 className="text-3xl font-bold text-white">Practice Results</h1>
            <div className="w-20"></div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">
                {results.score_percentage}%
              </h2>
              <p className="text-gray-300 text-lg">
                {results.correct_answers} out of {results.total_questions} correct
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 rounded-2xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{results.correct_answers}</p>
                <p className="text-gray-400">Correct</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 text-center">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {results.total_questions - results.correct_answers}
                </p>
                <p className="text-gray-400">Incorrect</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 text-center">
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {Math.round(results.avg_time_per_question)}s
                </p>
                <p className="text-gray-400">Avg Time</p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setTestSession(null);
                  setShowResults(false);
                  setResults(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Practice Again
              </button>
              <button
                onClick={() => navigate('/flex-dashboard')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testSession) {
    const question = testSession.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / testSession.questions.length) * 100;
    const CategoryIcon = getCategoryIcon(testSession.category);
    const isLastQuestion = currentQuestion === testSession.questions.length - 1;

    // Get display name for the category
    const displayCategory = mapBackendToFrontendCategory(testSession.category);

    // Ensure question has all required fields
    if (!question || !question.question_text || !question.options) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white text-xl mb-4">Invalid question format</p>
            <button
              onClick={() => setTestSession(null)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setTestSession(null)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Setup
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <CategoryIcon className="w-5 h-5" />
                <span className="font-semibold">{displayCategory}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-5 h-5" />
                <span>{timeSpent}s</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/5 rounded-full h-3 mb-8">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Question Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                  Question {currentQuestion + 1} of {testSession.questions.length}
                </span>
                <span className="ml-3 px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                  {question.difficulty?.charAt(0).toUpperCase() + question.difficulty?.slice(1)}
                </span>
                {isLastQuestion && (
                  <span className="ml-3 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-semibold">
                    Last Question
                  </span>
                )}
              </div>
              <span className="text-gray-400 text-sm">
                {question.subcategory || 'General'}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
              {question.question_text}
            </h2>

            {/* Options */}
            <div className="space-y-4 mb-8">
              {question.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = userAnswers[currentQuestion]?.answer === optionLetter;
                
                return (
                  <button
                    key={index}
                    onClick={() => !submittingAnswer && submitAnswer(optionLetter)}
                    disabled={submittingAnswer || userAnswers[currentQuestion]}
                    className={`w-full p-4 text-left bg-white/5 hover:bg-white/10 border ${
                      isSelected ? 'border-green-500 bg-green-500/20' : 'border-white/10'
                    } rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 ${
                        isSelected ? 'bg-green-500' : 'bg-white/10'
                      } rounded-lg flex items-center justify-center font-semibold`}>
                        {optionLetter}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={skipQuestion}
                disabled={submittingAnswer}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip Question
              </button>

              <div className="text-gray-400 text-sm">
                {submittingAnswer ? (
                  <span className="text-yellow-400">Submitting...</span>
                ) : (
                  <>
                    {isLastQuestion ? (
                      <span className="text-yellow-400 font-semibold">Last question - submit to finish</span>
                    ) : (
                      `${timeSpent} seconds`
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Practice Setup Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/flex-dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">Practice Drill</h1>
          <div className="w-20"></div>
        </div>

        {/* Setup Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Configure Your Practice Session
            </h2>
            <p className="text-gray-300">
              Choose your category, difficulty, and number of questions to start practicing
            </p>
          </div>

          {/* Category Selection */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-4">
              Select Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { frontend: 'Logical Reasoning', backend: 'Logical' },
                { frontend: 'Quantitative Aptitude', backend: 'Quantitative' },
                { frontend: 'Verbal Ability', backend: 'Verbal' },
                { frontend: 'Coding Challenge', backend: 'Coding' }
              ].map((categoryObj) => {
                const Icon = getCategoryIcon(categoryObj.backend);
                const colorClass = getCategoryColor(categoryObj.backend);
                const bgClass = getCategoryBgColor(categoryObj.backend);

                return (
                  <button
                    key={categoryObj.backend}
                    onClick={() => setSelectedCategory(categoryObj.backend)}
                    className={`p-4 rounded-2xl border-2 transition-all ${selectedCategory === categoryObj.backend
                        ? `border-white bg-gradient-to-br ${colorClass}/20`
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    <div className={`w-12 h-12 ${bgClass} rounded-xl flex items-center justify-center mb-3 mx-auto`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-semibold">{categoryObj.frontend}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-4">
              Difficulty Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { value: 'all', label: 'All Levels', color: 'from-gray-500 to-gray-600' },
                { value: 'easy', label: 'Easy', color: 'from-green-500 to-emerald-500' },
                { value: 'medium', label: 'Medium', color: 'from-yellow-500 to-orange-500' },
                { value: 'hard', label: 'Hard', color: 'from-red-500 to-pink-500' }
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSelectedDifficulty(level.value)}
                  className={`p-4 rounded-2xl border-2 transition-all ${selectedDifficulty === level.value
                      ? `border-white bg-gradient-to-br ${level.color}/20`
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <span className="text-white font-semibold">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-4">
              Number of Questions: {questionCount}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full h-3 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500"
            />
            <div className="flex justify-between text-gray-400 text-sm mt-2">
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
              <span>30</span>
              <span>35</span>
              <span>40</span>
              <span>45</span>
              <span>50</span>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startPracticeSession}
            disabled={!selectedCategory || loading}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Starting Practice...' : 'Start Practice Session'}
          </button>

          {/* Quick Start Options */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-white font-semibold mb-4 text-center">Quick Start</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { category: 'Logical', difficulty: 'medium', count: 10 },
                { category: 'Quantitative', difficulty: 'easy', count: 15 },
                { category: 'Verbal', difficulty: 'all', count: 20 }
              ].map((quickStart, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedCategory(quickStart.category);
                    setSelectedDifficulty(quickStart.difficulty);
                    setQuestionCount(quickStart.count);
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  <span className="text-white text-sm">
                    {mapBackendToFrontendCategory(quickStart.category)} ({quickStart.count} questions)
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}