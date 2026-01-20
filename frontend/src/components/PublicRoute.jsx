import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function PublicRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Check both Redux store and localStorage
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

      setHasToken(!!authToken);
      setIsChecking(false);
    };

    checkAuth();
  }, [token]);

  // Show nothing while checking to prevent flash
  if (isChecking) {
    return null;
  }

  // If authenticated, redirect to dashboard
  if (hasToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;
