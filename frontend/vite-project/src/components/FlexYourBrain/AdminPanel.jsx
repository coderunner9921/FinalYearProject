// frontend/vite-project/src/components/FlexYourBrain/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { generateAIQuestions, resetQuestionUsage, getAIQuestionStats } from '../../api/aptitude';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const domains = ['Logical', 'Quantitative', 'Verbal', 'Coding', 'Data Interpretation'];
  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getAIQuestionStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleGenerateQuestions = async (selectedDomains, selectedDifficulties) => {
    setLoading(true);
    setMessage('');
    try {
      const result = await generateAIQuestions(selectedDomains, selectedDifficulties);
      setMessage(`Successfully generated ${result.new_questions_count} new questions!`);
      await loadStats(); // Refresh stats
    } catch (error) {
      setMessage('Error generating questions: ' + error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetUsage = async () => {
    if (!window.confirm('Are you sure you want to reset all question usage tracking?')) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      await resetQuestionUsage();
      setMessage('Question usage tracking reset successfully!');
      await loadStats(); // Refresh stats
    } catch (error) {
      setMessage('Error resetting usage: ' + error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">AI Question Bank Admin</h2>
      
      {message && (
        <div className={`p-4 mb-4 rounded ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Stats Display */}
      {stats && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Current Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Total Questions:</strong> {stats.statistics.total_questions}
            </div>
            <div>
              <strong>Available:</strong> {stats.statistics.available_questions}
            </div>
            <div>
              <strong>Easy:</strong> {stats.statistics.difficulties.easy || 0}
            </div>
            <div>
              <strong>Medium:</strong> {stats.statistics.difficulties.medium || 0}
            </div>
            <div>
              <strong>Hard:</strong> {stats.statistics.difficulties.hard || 0}
            </div>
          </div>
        </div>
      )}

      {/* Generate Questions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Generate New Questions</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Domains:</label>
            <div className="flex flex-wrap gap-2">
              {domains.map(domain => (
                <label key={domain} className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2"
                    id={`domain-${domain}`}
                  />
                  {domain}
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select Difficulties:</label>
            <div className="flex flex-wrap gap-2">
              {difficulties.map(difficulty => (
                <label key={difficulty} className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2"
                    id={`difficulty-${difficulty}`}
                  />
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </label>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => {
              const selectedDomains = domains.filter(domain => 
                document.getElementById(`domain-${domain}`).checked
              );
              const selectedDifficulties = difficulties.filter(difficulty => 
                document.getElementById(`difficulty-${difficulty}`).checked
              );
              handleGenerateQuestions(selectedDomains, selectedDifficulties);
            }}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      </div>

      {/* Reset Usage */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Question Management</h3>
        <button
          onClick={handleResetUsage}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Reset All Question Usage
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This will reset which questions are marked as "used" - allowing all questions to be available again.
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;