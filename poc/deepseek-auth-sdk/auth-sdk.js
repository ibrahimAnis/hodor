// auth-sdk.js
(function (window, document) {
  "use strict";

  const AuthSDK = {
    config: {
      authUrl: "http://localhost:8081/realms/master",
      clientId: "profile",
      redirectUri: typeof window !== "undefined" ? window.location.origin : "",
      scope: "openid profile email",
      responseType: "code",
      storageKey: "auth_sdk_tokens",
      popupWidth: 500,
      popupHeight: 600,
      tokenValidation: true,
      jwksUri: "/.well-known/jwks.json",
    },

    init: function (config = {}) {
      this.config = { ...this.config, ...config };
      this._setupEventListeners();
      this._checkSession();
      return this;
    },

    withAuth: async function (request) {
      try {
        const tokens = this.getTokens();

        if (!tokens?.accessToken) {
          await this.login();
          return this.withAuth(request);
        }

        if (this._isTokenExpired(tokens.accessToken)) {
          const refreshed = await this._refreshToken();
          if (!refreshed) {
            await this.login();
            return this.withAuth(request);
          }
        }

        // CSRF protection for state-changing requests
        if (
          ["POST", "PUT", "PATCH", "DELETE"].includes(
            request.method?.toUpperCase()
          )
        ) {
          const csrfToken = this._generateCSRFToken();
          request.headers = {
            ...request.headers,
            "X-CSRF-TOKEN": csrfToken,
          };
        }

        request.headers = {
          ...request.headers,
          Authorization: `Bearer ${this.getTokens().accessToken}`,
        };

        return this._fetch(request);
      } catch (error) {
        this._handleError("AUTH_MIDDLEWARE_ERROR", error);
        throw error;
      }
    },

    login: async function () {
      try {
        const { codeVerifier, codeChallenge } = await this._generatePKCE();
        const state = this._generateRandomString(48);

        sessionStorage.setItem(`pkce_${state}`, codeVerifier);
        sessionStorage.setItem(`csrf_${state}`, state);

        const authUrl = new URL(`${this.config.authUrl}/authorize`);
        authUrl.searchParams.append("client_id", this.config.clientId);
        authUrl.searchParams.append("redirect_uri", this.config.redirectUri);
        authUrl.searchParams.append("response_type", "code");
        authUrl.searchParams.append("scope", this.config.scope);
        authUrl.searchParams.append("code_challenge", codeChallenge);
        authUrl.searchParams.append("code_challenge_method", "S256");
        authUrl.searchParams.append("state", state);

        return this._openPopup(authUrl.toString());
      } catch (error) {
        this._handleError("LOGIN_ERROR", error);
        throw error;
      }
    },

    logout: async function () {
      try {
        const tokens = this.getTokens();
        if (tokens?.refreshToken) {
          await this._revokeToken(tokens.refreshToken);
        }
        this._clearTokens();
        return Promise.resolve();
      } catch (error) {
        this._handleError("LOGOUT_ERROR", error);
        throw error;
      }
    },

    // ... (Keep previous getUser, getTokens, isAuthenticated methods)

    // Enhanced private methods
    _handleAuthCallback: async function () {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        const error = params.get("error");

        if (error) throw new Error(error);
        if (!code || !state)
          throw new Error("Missing authorization parameters");

        // CSRF and PKCE validation
        const storedState = sessionStorage.getItem(`csrf_${state}`);
        const codeVerifier = sessionStorage.getItem(`pkce_${state}`);
        sessionStorage.removeItem(`pkce_${state}`);
        sessionStorage.removeItem(`csrf_${state}`);

        if (state !== storedState) {
          throw new Error("Invalid state parameter");
        }

        const tokens = await this._exchangeCodeForToken(code, codeVerifier);
        await this._validateTokens(tokens);
        this._storeTokens(tokens);

        window.opener.postMessage(
          {
            type: "AUTH_SUCCESS",
            tokens,
          },
          this.config.authUrl
        );
        window.close();

        return tokens;
      } catch (error) {
        this._handleError("CALLBACK_ERROR", error);
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "AUTH_ERROR",
              error: error.message,
            },
            this.config.authUrl
          );
        }
        throw error;
      }
    },

    _exchangeCodeForToken: async function (code, codeVerifier) {
      try {
        const response = await fetch(`${this.config.authUrl}/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grant_type: "authorization_code",
            code,
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            code_verifier: codeVerifier,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Token exchange failed");
        }

        return response.json();
      } catch (error) {
        this._handleError("TOKEN_EXCHANGE_ERROR", error);
        throw error;
      }
    },

    _validateTokens: async function (tokens) {
      try {
        if (!tokens?.access_token || !tokens?.id_token) {
          throw new Error("Invalid token response");
        }

        // Validate ID Token
        const idToken = this._parseJwt(tokens.id_token);
        const now = Math.floor(Date.now() / 1000);

        if (idToken.exp < now) {
          throw new Error("ID token expired");
        }

        if (idToken.iss !== this.config.authUrl) {
          throw new Error("Invalid token issuer");
        }

        if (idToken.aud !== this.config.clientId) {
          throw new Error("Invalid token audience");
        }

        // Validate Access Token
        if (this.config.tokenValidation) {
          const accessToken = this._parseJwt(tokens.access_token);

          if (accessToken.exp < now) {
            throw new Error("Access token expired");
          }

          // If JWKS endpoint is configured, validate token signature
          if (this.config.jwksUri) {
            await this._validateTokenSignature(tokens.access_token);
          }
        }

        return true;
      } catch (error) {
        this._handleError("TOKEN_VALIDATION_ERROR", error);
        throw error;
      }
    },

    _validateTokenSignature: async function (token) {
      try {
        const header = JSON.parse(atob(token.split(".")[0]));
        const jwksResponse = await fetch(
          `${this.config.authUrl}${this.config.jwksUri}`
        );
        const jwks = await jwksResponse.json();
        const key = jwks.keys.find((k) => k.kid === header.kid);

        if (!key) {
          throw new Error("No matching JWK found");
        }

        // Implement actual signature verification logic here
        // This would typically use a crypto library to verify the signature
        // For production use, consider using a library like jose or jwt-decode
      } catch (error) {
        this._handleError("SIGNATURE_VALIDATION_ERROR", error);
        throw error;
      }
    },

    _generatePKCE: async function () {
      const codeVerifier = this._generateRandomString(128);
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      return { codeVerifier, codeChallenge };
    },

    _generateCSRFToken: function () {
      const token = this._generateRandomString(32);
      sessionStorage.setItem("csrf_token", token);
      return token;
    },

    _generateRandomString: function (length) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
    },

    _openPopup: function (url) {
      return new Promise((resolve, reject) => {
        const width = this.config.popupWidth;
        const height = this.config.popupHeight;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const popup = window.open(
          url,
          "authPopup",
          `width=${width},height=${height},top=${top},left=${left}`
        );

        if (!popup) {
          reject(
            new Error("Popup blocked. Please allow popups for this site.")
          );
          return;
        }

        const interval = setInterval(() => {
          if (popup.closed) {
            clearInterval(interval);
            reject(new Error("Popup closed by user"));
          }
        }, 500);

        const messageListener = (event) => {
          if (event.origin !== new URL(this.config.authUrl).origin) return;

          clearInterval(interval);
          popup.close();

          if (event.data.type === "AUTH_SUCCESS") {
            resolve();
          } else {
            reject(new Error(event.data.error || "Authentication failed"));
          }
        };

        window.addEventListener("message", messageListener);
      });
    },

    _handleError: function (type, error) {
      console.error(`Auth Error (${type}):`, error);
      this._emitEvent("error", {
        type,
        message: error.message,
        stack: error.stack,
      });
    },

    _parseJwt: function (token) {
      try {
        return JSON.parse(atob(token.split(".")[1]));
      } catch (e) {
        throw new Error("Invalid JWT format");
      }
    },

    // ... (Keep other private methods from previous version)
  };

  // Expose to window
  if (typeof window !== "undefined") {
    window.AuthSDK = AuthSDK;
  }

  // For module systems
  if (typeof module !== "undefined" && module.exports) {
    module.exports = AuthSDK;
  }
})(window, document);
