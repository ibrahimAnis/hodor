<template>
  <div>
    <h1>My App</h1>

    <!-- Public content -->
    <div v-if="!isAuthenticated">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div>
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div>
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <button type="submit" :disabled="loading">
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>
    </div>

    <!-- Protected content with directive -->
    <div v-auth:authenticated>
      <h2>Dashboard</h2>
      <p>Welcome, {{ user?.email }}</p>

      <!-- Role-based content -->
      <div v-auth:role="'admin'">
        <h3>Admin Panel</h3>
        <p>This content is only visible to admins</p>
      </div>

      <!-- Permission-based content -->
      <div v-auth:permission="'manage_users'">
        <h3>User Management</h3>
        <p>
          This content is only visible to users with manage_users permission
        </p>
      </div>

      <button @click="handleLogout">Logout</button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useAuth } from "../adapters/vue";

export default defineComponent({
  name: "App",
  setup() {
    const { client, user, isAuthenticated } = useAuth();
    const email = ref("");
    const password = ref("");
    const error = ref("");
    const loading = ref(false);

    const handleLogin = async () => {
      loading.value = true;
      error.value = "";

      try {
        await client.login({
          email: email.value,
          password: password.value,
        });
        // Redirect or handle successful login
      } catch (err) {
        error.value = "Invalid credentials";
      } finally {
        loading.value = false;
      }
    };

    const handleLogout = () => {
      client.logout();
    };

    return {
      user,
      isAuthenticated,
      email,
      password,
      error,
      loading,
      handleLogin,
      handleLogout,
    };
  },
});
</script>
