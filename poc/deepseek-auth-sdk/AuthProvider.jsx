// AuthProvider.jsx
import { useEffect, createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children, config }) {
  const [authState, setAuthState] = useState({
    isAuthenticated: window.AuthSDK.isAuthenticated(),
    user: window.AuthSDK.getUser(),
    isLoading: false,
    error: null
  });

  useEffect(() => {
    // Initialize SDK
    window.AuthSDK.init(config);

    // Set up event listeners
    const handleAuthChange = (event) => {
      setAuthState({
        isAuthenticated: event.detail.isAuthenticated,
        user: event.detail.user,
        isLoading: false,
        error: null
      });
    };

    window.addEventListener('auth:auth_change', handleAuthChange);

    return () => {
      window.removeEventListener('auth:auth_change', handleAuthChange);
    };
  }, [config]);

  const login = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await window.AuthSDK.login();
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }));
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    await window.AuthSDK.logout();
  };

  const value = {
    ...authState,
    login,
    logout,
    withAuth: window.AuthSDK.withAuth.bind(window.AuthSDK)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
