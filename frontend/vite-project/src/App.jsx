// frontend/vite-project/src/App.jsx - ADD EDIT PROFILE ROUTE
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Public pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Main dashboard
import MasterDashboard from './pages/MasterDashboard';

// FlexYourBrain module (fully functional)
import FlexYourBrainDashboard from './pages/FlexYourBrain/FlexYourBrainDashboard';
import PracticeDrill from './pages/FlexYourBrain/PracticeDrill';
import MockTest from './pages/FlexYourBrain/MockTest';
import SJTModule from './pages/FlexYourBrain/SJTModule';
import TestResults from './pages/FlexYourBrain/TestResults';
import AnalyticsDashboard from './pages/FlexYourBrain/AnalyticsDashboard';

// Profile & Settings
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';  // ADD THIS IMPORT
import Settings from './pages/Settings';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public routes - accessible without login */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes - require login */}
        <Route path="/master-dashboard" element={
          <ProtectedRoute>
            <MasterDashboard />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/edit-profile" element={  // ADD THIS ROUTE
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* FlexYourBrain routes */}
        <Route path="/flex-dashboard" element={
          <ProtectedRoute>
            <FlexYourBrainDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/practice-drill" element={
          <ProtectedRoute>
            <PracticeDrill />
          </ProtectedRoute>
        } />
        
        <Route path="/practice-drill/:category" element={
          <ProtectedRoute>
            <PracticeDrill />
          </ProtectedRoute>
        } />
        
        <Route path="/mock-test" element={
          <ProtectedRoute>
            <MockTest />
          </ProtectedRoute>
        } />
        
        <Route path="/sjt-module" element={
          <ProtectedRoute>
            <SJTModule />
          </ProtectedRoute>
        } />
        
        <Route path="/test-results" element={
          <ProtectedRoute>
            <TestResults />
          </ProtectedRoute>
        } />
        
        <Route path="/flex-analytics" element={
          <ProtectedRoute>
            <AnalyticsDashboard />
          </ProtectedRoute>
        } />

        {/* Redirect any unknown routes to welcome page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;