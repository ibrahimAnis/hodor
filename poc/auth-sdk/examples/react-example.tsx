import React, { useState } from "react";
import {
  createAuthClient,
  AuthProvider,
  useAuth,
  ProtectedRoute,
} from "../index";

// Create the auth client
const authClient = createAuthClient({
  apiUrl: "https://api.example.com/auth",
  tokenStorage: "localStorage",
  autoRefresh: true,
});

// Example login component
function LoginForm() {
  const { client } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await client.login({ email, password });
      // Redirect or handle successful login
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

// Example protected component
function AdminDashboard() {
  const { user, client } = useAuth();

  const handleLogout = () => {
    client.logout();
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

// Example App
function App() {
  return (
    <AuthProvider client={authClient}>
      <div>
        <h1>My App</h1>

        {/* Public route */}
        <div>
          <h2>Public Page</h2>
          <LoginForm />
        </div>

        {/* Protected route */}
        <ProtectedRoute
          element={<AdminDashboard />}
          requiredRoles={["admin"]}
          redirectUrl="/login"
        />
      </div>
    </AuthProvider>
  );
}

export default App;
