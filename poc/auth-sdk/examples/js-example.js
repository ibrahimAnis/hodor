import {
  createAuthClient,
  createAuthMiddleware,
  createAuthInterceptor,
} from "../index";

// Create the auth client
const authClient = createAuthClient({
  apiUrl: "https://localhost:8081/auth",
  tokenStorage: "localStorage",
  autoRefresh: true,
});

// Example Express middleware integration
function setupAuthMiddleware(app) {
  // Middleware for all routes
  app.use((req, res, next) => {
    // Attach auth client to request for use in routes
    req.authClient = authClient;
    next();
  });

  // Public routes
  app.get("/login", (req, res) => {
    res.send("Login page");
  });

  // Protected routes
  app.get(
    "/admin",
    createAuthMiddleware(authClient, {
      requireAuth: true,
      redirectUrl: "/login",
    }),
    (req, res) => {
      res.send("Admin dashboard");
    }
  );

  // Role-protected routes
  app.get(
    "/admin/settings",
    createAuthMiddleware(authClient, {
      requireAuth: true,
      requiredRoles: ["admin"],
      redirectUrl: "/login",
    }),
    (req, res) => {
      res.send("Admin settings");
    }
  );

  // Permission-protected routes
  app.get(
    "/admin/users",
    createAuthMiddleware(authClient, {
      requireAuth: true,
      requiredPermissions: ["manage_users"],
      redirectUrl: "/login",
    }),
    (req, res) => {
      res.send("User management");
    }
  );
}

// Example fetch API integration with auth interceptor
const interceptor = createAuthInterceptor(authClient);

// Custom fetch that includes the auth token
async function authenticatedFetch(url, options = {}) {
  // Apply request interceptor
  const interceptedOptions = interceptor.request(options);

  // Make the request
  let response = await fetch(url, interceptedOptions);

  // Apply response interceptor (handles 401s and token refresh)
  response = await interceptor.response(response);

  return response;
}

// Example usage
async function fetchProtectedData() {
  try {
    const response = await authenticatedFetch(
      "https://api.example.com/protected"
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch protected data:", error);
    throw error;
  }
}
