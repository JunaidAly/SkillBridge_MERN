import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { logout } from '../store/authSlice';

function ProtectedRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      // First check if token exists in Redux or localStorage
      let authToken = token;
      
      if (!authToken) {
        try {
          const stored = localStorage.getItem('auth');
          if (stored) {
            const auth = JSON.parse(stored);
            authToken = auth?.token;
          }
        } catch (err) {
          console.error('Error reading auth from localStorage:', err);
        }
      }

      // If no token found anywhere, not authenticated
      if (!authToken) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      // Validate token with backend
      try {
        const response = await apiClient.get('/auth/me');
        if (response.data.success) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          dispatch(logout());
        }
      } catch (error) {
        // Token is invalid or expired
        console.error('Token validation failed:', error);
        setIsAuthenticated(false);
        dispatch(logout());
      } finally {
        setIsChecking(false);
      }
    };

    validateToken();
  }, [token, dispatch]);

  // Show nothing while checking to prevent flash of redirect
  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;

