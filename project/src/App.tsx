import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider } from './authcontext' // Import AuthProvider
import PrivateRoute from './privateroute';    // Import PrivateRoute

const App: React.FC = () => {
  return (
    <Router>
      {/* Wrap everything in AuthProvider to provide auth context */}
      <AuthProvider>
        <Routes>
          {/* Protected Route for /home */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <LandingPage />
              </PrivateRoute>
            }
          />
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;