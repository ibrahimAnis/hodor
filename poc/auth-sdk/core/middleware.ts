import { AuthClient, AuthMiddlewareOptions } from './types';

// Generic middleware function for JavaScript apps
export function createAuthMiddleware(authClient: AuthClient, options: AuthMiddlewareOptions = {}) {
  return async (req: any, res: any, next: () => void) => {
    const { requireAuth = true, requiredRoles, requiredPermissions, redirectUrl } = options;
    
    // Skip middleware if auth isn't required
    if (!requireAuth) {
      return next();
    }
    
    // Check if user is authenticated
    if (!authClient.isAuthenticated()) {
      if (redirectUrl) {
        // Handle redirection for browser environments
        if (typeof window !== 'undefined') {
          window.location.href = redirectUrl;
          return;
        }
        // For server environments with response object
        if (res && typeof res.redirect === 'function') {
          return res.redirect(redirectUrl);
        }
      }
      
      // For API middleware
      if (res && typeof res.status === 'function') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      throw new Error('Unauthorized');
    }
    
    // Check role requirements
    if (requiredRoles && !authClient.hasRole(requiredRoles)) {
      if (res && typeof res.status === 'function') {
        return res.status(403).json({ message: 'Forbidden - Insufficient role' });
      }
      throw new Error('Forbidden - Insufficient role');
    }
    
    // Check permission requirements
    if (requiredPermissions && !authClient.hasPermission(requiredPermissions)) {
      if (res && typeof res.status === 'function') {
        return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
      }
      throw new Error('Forbidden - Insufficient permissions');
    }
    
    // All checks passed
    next();
  };
}

// HTTP interceptor for fetch or axios
export function createAuthInterceptor(authClient: AuthClient) {
  return {
    request: (config: any) => {
      if (authClient.isAuthenticated()) {
        const token = authClient.getToken();
        if (token) {
          // For fetch
          if (!config.headers) {
            config.headers = {};
          }
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    response: async (response: Response) => {
      // Handle 401 responses by refreshing token and retrying
      if (response.status === 401) {
        try {
          await authClient.refreshToken();
          // Retry the original request with new token
          const originalRequest = response.url;
          const options = {
            method: response.type,
            headers: {
              ...Array.from(response.headers.entries()).reduce((obj, [key, val]) => {
                obj[key] = val;
                return obj;
              }, {} as Record<string, string>),
              'Authorization': `Bearer ${authClient.getToken()}`
            }
          };
          return fetch(originalRequest, options);
        } catch (error) {
          // If refresh fails, logout
          authClient.logout();
          throw error;
        }
      }
      return response;
    }
  };
}

// Function to protect routes (useful for SPA routing)
export function protectRoute(authClient: AuthClient, options: AuthMiddlewareOptions = {}) {
  const { requireAuth = true, requiredRoles, requiredPermissions, redirectUrl } = options;
  
  // If auth isn't required, allow access
  if (!requireAuth) {
    return true;
  }
  
  // Check if user is authenticated
  if (!authClient.isAuthenticated()) {
    if (redirectUrl && typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
    return false;
  }
  
  // Check role requirements
  if (requiredRoles && !authClient.hasRole(requiredRoles)) {
    if (redirectUrl && typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
    return false;
  }
  
  // Check permission requirements
  if (requiredPermissions && !authClient.hasPermission(requiredPermissions)) {
    if (redirectUrl && typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
    return false;
  }
  
  // All checks passed
  return true;
}
