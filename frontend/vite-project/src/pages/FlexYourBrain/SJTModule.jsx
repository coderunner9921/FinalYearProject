// frontend/vite-project/src/pages/FlexYourBrain/SJTModule.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:8000";

export default function SJTModule() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/aptitude/sjt/scenarios?limit=10`);
      const data = await response.json();
      setScenarios(data.scenarios);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    const scenario = scenarios[currentScenario];
    const response = userResponses[currentScenario];
    
    if (!response || !response.mostEffective || !response.leastEffective) {
      alert('Please select both most and least effective responses');
      return;
    }

    try {
      const token = getToken();
      const submitResponse = await fetch(`${API_BASE_URL}/api/aptitude/sjt/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scenario_id: scenario.id,
          most_effective: response.mostEffective,
          least_effective: response.leastEffective
        })
      });

      const feedbackData = await submitResponse.json();
      setFeedback(feedbackData);
      setShowFeedback(true);
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const nextScenario = () => {
    setShowFeedback(false);
    setFeedback(null);
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(currentScenario + 1);
    } else {
      // All scenarios completed
      navigate('/flex-dashboard');
    }
  };

  const handleResponseSelect = (type, optionIndex) => {
    const optionLetter = String.fromCharCode(65 + optionIndex);
    setUserResponses(prev => ({
      ...prev,
      [currentScenario]: {
        ...prev[currentScenario],
        [type]: optionLetter
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white">No scenarios available.</p>
        </div>
      </div>
    );
  }

  const scenario = scenarios[currentScenario];
  const userResponse = userResponses[currentScenario] || {};

  if (showFeedback && feedback) {
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
            <h1 className="text-3xl font-bold text-white">SJT Feedback</h1>
            <div className="w-20"></div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 ${
                feedback.score >= 2 ? 'bg-green-500' : feedback.score >= 1 ? 'bg-yellow-500' : 'bg-red-500'
              } rounded-full flex items-center justify-center mx-auto mb-4`}>
                {feedback.score >= 2 ? (
                  <CheckCircle className="w-10 h-10 text-white" />
                ) : (
                  <XCircle className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Score: {feedback.score}/{feedback.max_score}
              </h2>
              <p className="text-gray-300">
                {feedback.score >= 2 ? 'Excellent judgment!' : 
                 feedback.score >= 1 ? 'Good effort!' : 'Needs improvement'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Most Effective Response</h3>
                <div className={`p-3 rounded-lg ${
                  feedback.most_correct ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {feedback.most_correct ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white font-semibold">Your choice: {feedback.your_most_effective}</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {scenario.options[feedback.your_most_effective.charCodeAt(0) - 65]}
                  </p>
                </div>
                {!feedback.most_correct && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white font-semibold">Recommended: {feedback.correct_most_effective}</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      {scenario.options[feedback.correct_most_effective.charCodeAt(0) - 65]}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Least Effective Response</h3>
                <div className={`p-3 rounded-lg ${
                  feedback.least_correct ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {feedback.least_correct ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white font-semibold">Your choice: {feedback.your_least_effective}</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {scenario.options[feedback.your_least_effective.charCodeAt(0) - 65]}
                  </p>
                </div>
                {!feedback.least_correct && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white font-semibold">Recommended: {feedback.correct_least_effective}</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      {scenario.options[feedback.correct_least_effective.charCodeAt(0) - 65]}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Explanation
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feedback.explanation}
              </p>
            </div>

            <button
              onClick={nextScenario}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg transition-all"
            >
              {currentScenario < scenarios.length - 1 ? 'Next Scenario' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white">Situational Judgment Test</h1>
          <div className="text-gray-400">
            {currentScenario + 1} of {scenarios.length}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
          {/* Scenario */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-purple-400" />
              <span className="px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-300">
                {scenario.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-4 leading-relaxed">
              {scenario.scenario_text}
            </h2>
          </div>

          {/* Most Effective Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Select the MOST effective response:
            </h3>
            <div className="space-y-3">
              {scenario.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index);
                const isSelected = userResponse.mostEffective === optionLetter;
                return (
                  <button
                    key={index}
                    onClick={() => handleResponseSelect('mostEffective', index)}
                    className={`w-full p-4 text-left rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-green-500/20 border-green-500 text-white' 
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold ${
                        isSelected ? 'bg-green-500 text-white' : 'bg-white/10'
                      }`}>
                        {optionLetter}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Least Effective Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Select the LEAST effective response:
            </h3>
            <div className="space-y-3">
              {scenario.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index);
                const isSelected = userResponse.leastEffective === optionLetter;
                return (
                  <button
                    key={index}
                    onClick={() => handleResponseSelect('leastEffective', index)}
                    className={`w-full p-4 text-left rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-red-500/20 border-red-500 text-white' 
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold ${
                        isSelected ? 'bg-red-500 text-white' : 'bg-white/10'
                      }`}>
                        {optionLetter}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={submitResponse}
            disabled={!userResponse.mostEffective || !userResponse.leastEffective}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            Submit Response
          </button>
        </div>
      </div>
    </div>
  );
}