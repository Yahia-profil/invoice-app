import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { Dashboard } from '../pages/Dashboard';
import { InvoiceForm } from '../components/InvoiceForm';
import { QuoteForm } from '../components/QuoteForm';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

export const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/dashboard" /> : <LoginForm />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/invoice-form" 
          element={
            <PrivateRoute>
              <InvoiceForm />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/quote-form" 
          element={
            <PrivateRoute>
              <QuoteForm />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={currentUser ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </Router>
  );
};
