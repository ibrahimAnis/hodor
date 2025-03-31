import { 
    AuthClient, 
    AuthConfig, 
    LoginCredentials, 
    User, 
    AuthResponse, 
    RefreshResponse,
    TokenData
  } from './types';
  
  const DEFAULT_CONFIG: Partial<AuthConfig> = {
    tokenStorage: 'localStorage',
    authHeader: 'Authorization',
    tokenPrefix: 'Bearer',
    autoRefresh: true,
    refreshThreshold: 300, // 5 minutes
  };
  
  export class AuthSDK implements AuthClient {
    private config: AuthConfig;
    private user: User | null = null;
    private tokenData: TokenData | null = null;
    private refreshTimer: NodeJS.Timeout | null = null;
    private listeners: Array<(user: User | null) => void> = [];
  
    constructor(config: AuthConfig) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.initFromStorage();
      
      if (this.tokenData && this.config.autoRefresh) {
        this.setupRefreshTimer();
      }
    }
  
    private initFromStorage(): void {
      const storedData = this.getStoredToken();
      if (storedData) {
        try {
          this.tokenData = JSON.parse(storedData);
          this.user = this.parseUserFromToken(this.tokenData.accessToken);
          
          // Check if token is expired
          if (this.tokenData.expiresAt && this.tokenData.expiresAt < Date.now()) {
            if (this.tokenData.refreshToken) {
              this.refreshToken().catch(() => this.clearAuth());
            } else {
              this.clearAuth();
            }
          }
        } catch (e) {
          this.clearAuth();
        }
      }
    }
  
    private parseUserFromToken(token: string): User | null {
      try {
        // Simple JWT parsing (payload is the second part)
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.user || decoded;
      } catch (e) {
        return null;
      }
    }
  
    private getStoredToken(): string | null {
      switch (this.config.tokenStorage) {
        case 'localStorage':
          return localStorage.getItem('auth_token');
        case 'sessionStorage':
          return sessionStorage.getItem('auth_token');
        case 'cookie':
          return this.getCookieValue('auth_token');
        default:
          return null;
      }
    }
  
    private getCookieValue(name: string): string | null {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    }
  
    private storeToken(data: string): void {
      switch (this.config.tokenStorage) {
        case 'localStorage':
          localStorage.setItem('auth_token', data);
          break;
        case 'sessionStorage':
          sessionStorage.setItem('auth_token', data);
          break;
        case 'cookie':
          const { domain, path, secure, sameSite } = this.config.cookieOptions || {};
          let cookieStr = `auth_token=${encodeURIComponent(data)}; path=${path || '/'}`;
          if (domain) cookieStr += `; domain=${domain}`;
          if (secure) cookieStr += '; secure';
          if (sameSite) cookieStr += `; samesite=${sameSite}`;
          document.cookie = cookieStr;
          break;
      }
    }
  
    private clearStoredToken(): void {
      switch (this.config.tokenStorage) {
        case 'localStorage':
          localStorage.removeItem('auth_token');
          break;
        case 'sessionStorage':
          sessionStorage.removeItem('auth_token');
          break;
        case 'cookie':
          const { domain, path } = this.config.cookieOptions || {};
          document.cookie = `auth_token=; path=${path || '/'}${domain ? `; domain=${domain}` : ''}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          break;
      }
    }
  
    private clearAuth(): void {
      this.user = null;
      this.tokenData = null;
      this.clearStoredToken();
      this.clearRefreshTimer();
      this.notifyListeners();
    }
  
    private setupRefreshTimer(): void {
      this.clearRefreshTimer();
      
      if (!this.tokenData?.expiresAt || !this.tokenData?.refreshToken) return;
      
      const now = Date.now();
      const expiresAt = this.tokenData.expiresAt;
      const refreshThreshold = this.config.refreshThreshold! * 1000;
      const timeUntilRefresh = Math.max(0, expiresAt - now - refreshThreshold);
      
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch(() => {});
      }, timeUntilRefresh);
    }
  
    private clearRefreshTimer(): void {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
    }
  
    private notifyListeners(): void {
      for (const listener of this.listeners) {
        listener(this.user);
      }
    }
  
    // Public API methods
    
    public async login(credentials: LoginCredentials): Promise<AuthResponse> {
      const response = await fetch(`${this.config.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const data: AuthResponse = await response.json();
      this.user = data.user;
      
      const expiresAt = data.expiresIn 
        ? Date.now() + data.expiresIn * 1000
        : undefined;
      
      this.tokenData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt
      };
      
      this.storeToken(JSON.stringify(this.tokenData));
      
      if (this.config.autoRefresh && data.refreshToken && expiresAt) {
        this.setupRefreshTimer();
      }
      
      this.notifyListeners();
      return data;
    }
  
    public async logout(): Promise<void> {
      if (this.tokenData?.accessToken) {
        try {
          await fetch(`${this.config.apiUrl}/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              [this.config.authHeader!]: `${this.config.tokenPrefix} ${this.tokenData.accessToken}`
            },
          });
        } catch (e) {
          // Ignore errors during logout
        }
      }
      
      this.clearAuth();
    }
  
    public async refreshToken(): Promise<RefreshResponse> {
      if (!this.tokenData?.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${this.config.apiUrl}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.tokenData.refreshToken }),
      });
      
      if (!response.ok) {
        this.clearAuth();
        throw new Error('Failed to refresh token');
      }
      
      const data: RefreshResponse = await response.json();
      
      const expiresAt = data.expiresIn 
        ? Date.now() + data.expiresIn * 1000
        : undefined;
      
      this.tokenData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || this.tokenData.refreshToken,
        expiresAt: expiresAt || this.tokenData.expiresAt
      };
      
      this.storeToken(JSON.stringify(this.tokenData));
      
      // Update user data if needed
      this.user = this.parseUserFromToken(data.accessToken);
      this.notifyListeners();
      
      if (this.config.autoRefresh && expiresAt) {
        this.setupRefreshTimer();
      }
      
      return data;
    }
  
    public getUser(): User | null {
      return this.user;
    }
  
    public isAuthenticated(): boolean {
      return !!this.user && !!this.tokenData?.accessToken;
    }
  
    public hasRole(role: string | string[]): boolean {
      if (!this.user || !this.user.roles) return false;
      
      if (Array.isArray(role)) {
        return role.some(r => this.user!.roles!.includes(r));
      }
      
      return this.user.roles.includes(role);
    }
  
    public hasPermission(permission: string | string[]): boolean {
      if (!this.user || !this.user.permissions) return false;
      
      if (Array.isArray(permission)) {
        return permission.some(p => this.user!.permissions!.includes(p));
      }
      
      return this.user.permissions.includes(permission);
    }
  
    public getToken(): string | null {
      return this.tokenData?.accessToken || null;
    }
  
    public setToken(tokenData: TokenData): void {
      this.tokenData = tokenData;
      this.user = this.parseUserFromToken(tokenData.accessToken);
      this.storeToken(JSON.stringify(tokenData));
      
      if (this.config.autoRefresh && tokenData.expiresAt) {
        this.setupRefreshTimer();
      }
      
      this.notifyListeners();
    }
  
    public onAuthStateChanged(callback: (user: User | null) => void): () => void {
      this.listeners.push(callback);
      // Initial call with current state
      callback(this.user);
      
      // Return unsubscribe function
      return () => {
        this.listeners = this.listeners.filter(listener => listener !== callback);
      };
    }
  }
  
  // Factory function for creating auth client
  export function createAuthClient(config: AuthConfig): AuthClient {
    return new AuthSDK(config);
  }
  