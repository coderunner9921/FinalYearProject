import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AudioRecorder from '../components/AudioRecorder';
import FeedbackCard from '../components/FeedbackCard';

const InterviewPractice = () => {
  const { domain } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuestions();
    startInterviewSession();
  }, [domain]);

  const startInterviewSession = async () => {
    try {
      // For demo, using user_id 1. In production, use actual user authentication
      const response = await axios.post('http://localhost:8000/api/interviews/start', null, {
        params: { user_id: 1, domain }
      });
      setCurrentSessionId(response.data.session_id);
    } catch (error) {
      console.error('Error starting interview session:', error);
      setError('Failed to start interview session');
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/questions/domain/${domain}`);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingComplete = async (audioBlob) => {
    if (!currentSessionId) {
      setError('Interview session not started properly');
      return;
    }

    setIsAnalyzing(true);
    setShowFeedback(false);
    setError('');

    try {
      const formData = new FormData();
      formData.append('session_id', currentSessionId);
      formData.append('question_id', questions[currentQuestionIndex].id);
      formData.append('audio_data', audioBlob, 'recording.webm');

      const response = await axios.post(
        'http://localhost:8000/api/evaluation/analyze-response',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.success) {
        setFeedback(response.data);
        setShowFeedback(true);
      } else {
        setError('Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing response:', error);
      if (error.code === 'ECONNABORTED') {
        setError('Analysis timed out. Please try with a shorter recording.');
      } else {
        setError('Error analyzing your response. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setShowFeedback(false);
    setError('');
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeInterviewSession();
    }
  };

  const completeInterviewSession = async () => {
    try {
      if (currentSessionId) {
        const overallScore = feedback?.scores?.overall || 7.0;
        await axios.post(`http://localhost:8000/api/interviews/${currentSessionId}/complete`, null, {
          params: { overall_score: overallScore }
        });
      }
      
      navigate('/dashboard', { 
        state: { 
          message: `Congratulations! You completed the ${domain} interview.`,
          score: feedback?.scores?.overall 
        }
      });
    } catch (error) {
      console.error('Error completing interview session:', error);
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading questions...</div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">No questions found for this domain.</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {domain} Interview
            </h1>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {domain}
            </span>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {currentQuestion.question_text}
            </h2>
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="mr-2">🎯</span> Key points to cover:
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.expected_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Audio Recorder */}
          <AudioRecorder 
            onRecordingComplete={handleRecordingComplete}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">❌</div>
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        )}

        {/* Feedback Card */}
        {showFeedback && feedback && (
          <FeedbackCard 
            feedback={feedback.feedback}
            scores={feedback.scores}
            transcribedText={feedback.transcribed_text}
            improvementTips={feedback.improvement_tips}
          />
        )}

        {/* Navigation */}
        {(showFeedback || currentQuestionIndex > 0) && (
          <div className="text-center">
            <button
              onClick={handleNextQuestion}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-md font-semibold transition-colors shadow-sm"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPractice;