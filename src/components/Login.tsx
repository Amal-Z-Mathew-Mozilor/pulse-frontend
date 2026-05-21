import { useState } from "react";
import { auth, setToken } from "../api";

type Mode = "signin" | "signup";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } =
        mode === "signin"
          ? await auth.login(username, password)
          : await auth.signup(username, email, password);
      setToken(access_token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${mode === "signin" ? "Login" : "Signup"} failed`);
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";
  const disabled =
    loading || !username || !password || (isSignup && !email);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
    }}>
      <div style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "40px 48px",
        width: 360,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, letterSpacing: "0.02em" }}>Pulse</h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>
            {isSignup ? "Create your account" : "Organizational memory for your team"}
          </p>
        </div>

        {error && (
          <div className="banner warn" style={{ marginBottom: 0, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              minLength={isSignup ? 3 : undefined}
              maxLength={64}
              disabled={loading}
              placeholder={isSignup ? "Choose a username" : "admin"}
            />
          </div>
          {isSignup && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
                placeholder="you@example.com"
              />
            </div>
          )}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={isSignup ? 8 : undefined}
              disabled={loading}
              placeholder={isSignup ? "At least 8 characters" : "••••••••"}
            />
          </div>
          <button type="submit" disabled={disabled} style={{ marginTop: 4 }}>
            {loading
              ? (isSignup ? "Creating account…" : "Signing in…")
              : (isSignup ? "Create account" : "Sign in")}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent, #4f8bff)",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 13,
                }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent, #4f8bff)",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 13,
                }}
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
