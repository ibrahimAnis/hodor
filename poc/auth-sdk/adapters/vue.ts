import { ref, readonly, inject, provide, InjectionKey, Ref, watchEffect, Plugin } from 'vue';
import { AuthClient, User } from '../core/types';

// Type for the Auth plugin
interface AuthPluginOptions {
  client: AuthClient;
}

// Create a symbol for provide/inject
const authKey = Symbol('auth') as InjectionKey<{
  client: AuthClient;
  user: Ref<User | null>;
  loading: Ref<boolean>;
  isAuthenticated: Ref<boolean>;
}>;

// Create auth composition function
export function createAuth(client: AuthClient) {
  const user = ref<User | null>(client.getUser());
  const loading = ref(true);
  const isAuthenticated = ref(client.isAuthenticated());
  
  // Subscribe to auth changes
  const unsubscribe = client.onAuthStateChanged((newUser) => {
    user.value = newUser;
    isAuthenticated.value = client.isAuthenticated();
    loading.value = false;
  });
  
  // Cleanup function
  const cleanup = () => {
    unsubscribe();
  };
  
  // Initial load is complete
  loading.value = false;
  
  return {
    client,
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated: readonly(isAuthenticated),
    hasRole: (role: string | string[]) => client.hasRole(role),
    hasPermission: (permission: string | string[]) => client.hasPermission(permission),
    cleanup
  };
}

// Vue plugin
export const createAuthPlugin = (options: AuthPluginOptions): Plugin => {
  return {
    install(app) {
      const { client } = options;
      const auth = createAuth(client);
      
      // Provide auth to the entire app
      provide(authKey, {
        client,
        user: auth.user,
        loading: auth.loading,
        isAuthenticated: auth.isAuthenticated
      });
      
      // Add global properties
      app.config.globalProperties.$auth = auth;
      
      // Cleanup on app unmount
      app.unmount = (() => {
        const originalUnmount = app.unmount;
        return function() {
          auth.cleanup();
          originalUnmount();
        };
      })();
    }
  };
};

// Composition API hook
export function useAuth() {
  const auth = inject(authKey);
  if (!auth) {
    throw new Error('useAuth must be used within an app with the auth plugin installed');
  }
  
  return {
    client: auth.client,
    user: auth.user,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    hasRole: (role: string | string[]) => auth.client.hasRole(role),
    hasPermission: (permission: string | string[]) => auth.client.hasPermission(permission)
  };
}

// Navigation guard for Vue Router
export function createAuthGuard(client: AuthClient) {
  return (to: any, from: any, next: Function) => {
    const { requireAuth, requiredRoles, requiredPermissions, redirectUrl } = to.meta || {};
    
    // Skip checks if auth isn't required
    if (!requireAuth) {
      return next();
    }
    
    // Check if user is authenticated
    if (!client.isAuthenticated()) {
      return redirectUrl ? next(redirectUrl) : next(false);
    }
    
    // Check role requirements
    if (requiredRoles && !client.hasRole(requiredRoles)) {
      return redirectUrl ? next(redirectUrl) : next(false);
    }
    
    // Check permission requirements
    if (requiredPermissions && !client.hasPermission(requiredPermissions)) {
      return redirectUrl ? next(redirectUrl) : next(false);
    }
    
    // All checks passed
    next();
  };
}

// Directive for conditionally rendering elements based on auth state
export const vAuth = {
  mounted(el: HTMLElement, binding: any, vnode: any) {
    const { client } = inject(authKey) as { client: AuthClient };
    const { value, arg, modifiers } = binding;
    
    // Extract the directive arguments
    const type = arg || 'authenticated';
    const condition = value;
    
    // Check if the element should be displayed
    let show = false;
    
    if (type === 'authenticated') {
      show = client.isAuthenticated();
    } else if (type === 'role') {
      show = client.hasRole(condition);
    } else if (type === 'permission') {
      show = client.hasPermission(condition);
    }
    
    // Negate the condition if using v-auth:not
    if (modifiers.not) {
      show = !show;
    }
    
    // Hide or show the element
    if (!show) {
      const comment = document.createComment(' ');
      Object.defineProperty(comment, 'setAttribute', {
        value: () => undefined,
      });
      vnode.el = comment;
      el.parentNode?.replaceChild(comment, el);
    }
  }
};
