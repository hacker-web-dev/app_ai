import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider } from './authcontext'
import PrivateRoute from './privateroute';
import { useTheme } from './contexts/ThemeContext';

const AppContent: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <Router>
        {/* Wrap everything in AuthProvider to provide auth context */}
        <AuthProvider>
        <Routes>
          {/* Make LandingPage the default public route */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Search page is public */}
          <Route path="/search" element={<SearchPage />} />

          {/* Authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected dashboard route - users go here after login */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <LandingPage dashboardMode={true} />
              </PrivateRoute>
            }
          />

          {/* Keep backward compatibility - redirect /home to / */}
          <Route path="/home" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;