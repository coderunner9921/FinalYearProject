// frontend/vite-project/src/pages/FlexYourBrain/TestResults.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Target,
  Sparkles,
  Award,
  X
} from 'lucide-react';

export default function TestResults() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      const {
        testSession,
        userAnswers,
        timeSpent
      } = location.state;

    }
  }, [location.state]);

  // Calculate results from test data
  const calculateResults = () => {
    if (!location.state?.testSession || !location.state?.userAnswers) {
      return null;
    }

    const { testSession, userAnswers, timeSpent = 0 } = location.state;

    const correctAnswers = Object.values(userAnswers).filter(
      answer => answer.answer === testSession.questions[answer.questionIndex]?.correct_answer
    ).length;

    const scorePercentage = (correctAnswers / testSession.questions.length) * 100;
    const timePerQuestion = timeSpent / testSession.questions.length;

    return {
      testSession,
      correctAnswers,
      scorePercentage,
      timePerQuestion,
      totalQuestions: testSession.questions.length
    };
  };

  const results = calculateResults();

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">No test results available.</p>
          <button
            onClick={() => navigate('/flex-dashboard')}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { testSession, correctAnswers, scorePercentage, timePerQuestion, totalQuestions } = results;

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
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Test Results</h1>
          </div>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>

        {/* Results Summary */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 
                          ${scorePercentage >= 90 ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                scorePercentage >= 70 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                  scorePercentage >= 50 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                    'bg-gradient-to-br from-red-500 to-pink-500'}`}>
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              {scorePercentage.toFixed(1)}%
            </h2>
            <p className="text-gray-300 text-lg">
              {correctAnswers} out of {totalQuestions} correct
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{correctAnswers}</p>
              <p className="text-gray-400">Correct</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {totalQuestions - correctAnswers}
              </p>
              <p className="text-gray-400">Incorrect</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {Math.round(timePerQuestion)}s
              </p>
              <p className="text-gray-400">Avg Time</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white/5 rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>Accuracy</span>
                  <span>{scorePercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${scorePercentage >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        scorePercentage >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                          scorePercentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                    style={{ width: `${scorePercentage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>Speed</span>
                  <span>{Math.round(timePerQuestion)}s per question</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, (60 - timePerQuestion) / 60 * 100))}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>Completion</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/practice-drill')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105"
            >
              Practice More
            </button>
            <button
              onClick={() => navigate('/flex-analytics')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all hover:scale-105"
            >
              View Analytics
            </button>
            
            <button
              onClick={() => navigate('/mock-test')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all hover:scale-105"
            >
              Take Another Test
            </button>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-400" />
            Question Review
          </h3>

          <div className="space-y-4">
            {testSession.questions.map((question, index) => {
              const userAnswer = location.state.userAnswers[index];
              const isCorrect = userAnswer?.answer === question.correct_answer;

              return (
                <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-semibold">Question {index + 1}</span>
                    <div className={`px-3 py-1 rounded-full text-sm ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-3">{question.question_text}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Your answer: </span>
                      <span className={isCorrect ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {userAnswer?.answer || 'Not answered'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Correct answer: </span>
                      <span className="text-green-400 font-semibold">{question.correct_answer}</span>
                    </div>
                  </div>

                  {question.explanation && !isCorrect && (
                    <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-blue-400 text-sm font-semibold mb-1">Explanation:</p>
                      <span className="text-blue-300 text-sm">{question.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}