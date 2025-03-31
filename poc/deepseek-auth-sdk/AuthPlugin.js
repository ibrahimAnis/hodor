<!-- AuthPlugin.js -->
export default {
  install(app, config) {
    // Initialize SDK
    window.AuthSDK.init(config);
    
    // Provide auth methods to all components
    app.provide('auth', {
      login: window.AuthSDK.login.bind(window.AuthSDK),
      logout: window.AuthSDK.logout.bind(window.AuthSDK),
      getUser: window.AuthSDK.getUser.bind(window.AuthSDK),
      isAuthenticated: window.AuthSDK.isAuthenticated.bind(window.AuthSDK),
      withAuth: window.AuthSDK.withAuth.bind(window.AuthSDK)
    });
    
    // Reactivity for auth state
    const authState = Vue.reactive({
      isAuthenticated: window.AuthSDK.isAuthenticated(),
      user: window.AuthSDK.getUser()
    });
    
    // Update state on changes
    window.addEventListener('auth:auth_change', (event) => {
      authState.isAuthenticated = event.detail.isAuthenticated;
      authState.user = event.detail.user;
    });
    
    app.provide('authState', authState);
  }
}
