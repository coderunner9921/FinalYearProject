import React from 'react';

const FeedbackCard = ({ feedback, scores, transcribedText, improvementTips }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 8) return '✅';
    if (score >= 6) return '⚠️';
    return '❌';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">Analysis Complete</h3>
        <div className="flex items-center space-x-4">
          <div className="text-3xl font-bold">{scores.overall}/10</div>
          <div className="text-blue-100">
            {scores.overall >= 8 ? 'Excellent!' : 
             scores.overall >= 6 ? 'Good job!' : 'Keep practicing!'}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Transcription */}
        {transcribedText && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">🎯</span> Your Response
            </h4>
            <p className="text-gray-600 italic">"{transcribedText}"</p>
          </div>
        )}

        {/* Score Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(scores).map(([key, score]) => (
            key !== 'overall' && (
              <div key={key} className={`border-2 rounded-lg p-4 text-center ${getScoreColor(score)}`}>
                <div className="text-sm font-medium capitalize mb-1">
                  {key}
                </div>
                <div className="text-2xl font-bold mb-1">
                  {score}
                </div>
                <div className="text-xs opacity-75">
                  {getScoreIcon(score)} {score >= 8 ? 'Strong' : score >= 6 ? 'Good' : 'Needs work'}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Detailed Feedback */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 text-lg flex items-center">
            <span className="mr-2">📊</span> Detailed Feedback
          </h4>
          <div className="space-y-3">
            {feedback.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border">
                <span className="text-lg mt-0.5">{item.split(' ')[0]}</span>
                <span className="flex-1">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Tips */}
        {improvementTips && improvementTips.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 text-lg flex items-center">
              <span className="mr-2">💡</span> Improvement Tips
            </h4>
            <div className="space-y-2">
              {improvementTips.map((tip, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">{tip}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackCard;