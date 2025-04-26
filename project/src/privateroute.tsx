import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authcontext'; // Adjust the import path as necessary

interface PrivateRouteProps {
  redirectPath?: string;
  children: React.ReactNode; // Add children to the interface
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ redirectPath = '/login', children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to={redirectPath} replace />;
};

export default PrivateRoute;