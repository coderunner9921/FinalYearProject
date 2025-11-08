import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import InterviewPractice from './pages/InterviewPractice'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/interview/:domain" element={<InterviewPractice />} />
          <Route path="/progress" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Progress Tracking</h2>
                  <p className="text-gray-600 mb-6">
                    Track your interview performance, view analytics, and monitor your improvement over time.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      🚧 Progress tracking feature coming in Phase 4 - Gamification & Analytics
                    </p>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-gray-600">Sessions Completed</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">1</div>
                      <div className="text-gray-600">Current Level</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-gray-600">Badges Earned</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } />
          <Route path="/feedback" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Interview Completed! 🎉</h2>
                  <p className="text-gray-600 mb-6">
                    Great job! Your interview session has been completed successfully.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800 font-medium">
                      ✅ All responses have been analyzed and saved to your progress.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <button
                      onClick={() => window.history.back()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold transition-colors"
                    >
                      Back to Dashboard
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-md font-semibold transition-colors"
                    >
                      Practice Another Interview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          } />
          {/* 404 Page */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <a
                  href="/"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-semibold transition-colors"
                >
                  Go Home
                </a>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App