import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthClient, User } from "../core/types";

// Create context
interface AuthContextValue {
  client: AuthClient;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  client: AuthClient;
  children: ReactNode;
  loadingComponent?: ReactNode;
}

export function AuthProvider({
  client,
  children,
  loadingComponent,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(client.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = client.onAuthStateChanged((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    // Initial load is complete
    setLoading(false);

    // Cleanup subscription
    return unsubscribe;
  }, [client]);

  const contextValue: AuthContextValue = {
    client,
    user,
    loading,
    isAuthenticated: client.isAuthenticated(),
    hasRole: (role) => client.hasRole(role),
    hasPermission: (permission) => client.hasPermission(permission),
  };

  if (loading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Higher-order component for protected routes
interface WithAuthOptions {
  requireAuth?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  redirectUrl?: string;
  fallback?: ReactNode;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    requireAuth = true,
    requiredRoles,
    requiredPermissions,
    redirectUrl = "/login",
    fallback = null,
  } = options;

  function WithAuthComponent(props: P) {
    const { client, user, loading } = useAuth();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      if (loading) return;

      // Check authorization
      if (!requireAuth) {
        setAuthorized(true);
        return;
      }

      // Check if user is authenticated
      if (!client.isAuthenticated()) {
        if (redirectUrl && typeof window !== "undefined") {
          window.location.href = redirectUrl;
        }
        setAuthorized(false);
        return;
      }

      // Check role requirements
      if (requiredRoles && !client.hasRole(requiredRoles)) {
        if (redirectUrl && typeof window !== "undefined") {
          window.location.href = redirectUrl;
        }
        setAuthorized(false);
        return;
      }

      // Check permission requirements
      if (requiredPermissions && !client.hasPermission(requiredPermissions)) {
        if (redirectUrl && typeof window !== "undefined") {
          window.location.href = redirectUrl;
        }
        setAuthorized(false);
        return;
      }

      // All checks passed
      setAuthorized(true);
    }, [loading, user]);

    if (loading) return null;
    if (!authorized) return <>{fallback}</>;

    return <Component {...props} />;
  }

  // Set display name for debugging
  const componentName = Component.displayName || Component.name || "Component";
  WithAuthComponent.displayName = `WithAuth(${componentName})`;

  return WithAuthComponent;
}

// Protected route component for React Router
interface ProtectedRouteProps {
  element: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  redirectUrl?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  element,
  requireAuth = true,
  requiredRoles,
  requiredPermissions,
  redirectUrl = "/login",
  fallback = null,
}: ProtectedRouteProps) {
  const { client, loading } = useAuth();

  // If still loading, show nothing
  if (loading) return null;

  // Skip checks if auth isn't required
  if (!requireAuth) {
    return <>{element}</>;
  }

  // Check if user is authenticated
  if (!client.isAuthenticated()) {
    if (redirectUrl && typeof window !== "undefined") {
      window.location.href = redirectUrl;
    }
    return <>{fallback}</>;
  }

  // Check role requirements
  if (requiredRoles && !client.hasRole(requiredRoles)) {
    if (redirectUrl && typeof window !== "undefined") {
      window.location.href = redirectUrl;
    }
    return <>{fallback}</>;
  }

  // Check permission requirements
  if (requiredPermissions && !client.hasPermission(requiredPermissions)) {
    if (redirectUrl && typeof window !== "undefined") {
      window.location.href = redirectUrl;
    }
    return <>{fallback}</>;
  }

  // All checks passed
  return <>{element}</>;
}
