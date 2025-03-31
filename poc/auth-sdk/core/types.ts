// Core types for the Auth SDK

export interface User {
    id: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    [key: string]: any;
  }
  
  export interface AuthConfig {
    apiUrl: string;
    tokenStorage?: 'localStorage' | 'sessionStorage' | 'cookie';
    cookieOptions?: {
      domain?: string;
      path?: string;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    };
    authHeader?: string;
    tokenPrefix?: string;
    autoRefresh?: boolean;
    refreshThreshold?: number; // in seconds
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
    [key: string]: any;
  }
  
  export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }
  
  export interface RefreshResponse {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }
  
  export interface TokenData {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }
  
  export interface AuthMiddlewareOptions {
    requireAuth?: boolean;
    requiredRoles?: string[];
    requiredPermissions?: string[];
    redirectUrl?: string;
  }
  
  export interface AuthClient {
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    logout(): Promise<void>;
    refreshToken(): Promise<RefreshResponse>;
    getUser(): User | null;
    isAuthenticated(): boolean;
    hasRole(role: string | string[]): boolean;
    hasPermission(permission: string | string[]): boolean;
    getToken(): string | null;
    setToken(tokenData: TokenData): void;
    onAuthStateChanged(callback: (user: User | null) => void): () => void;
  }
  