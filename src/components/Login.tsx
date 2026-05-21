import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { auth, setToken } from "../api";

const GOOGLE_ENABLED = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined);

type Mode = "signin" | "create_workspace" | "join_workspace" | "forgot";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [identifier, setIdentifier] = useState(""); // username OR email at sign in
  const [username, setUsername] = useState("");      // signup only
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPendingEmail(null);
    setResetSent(false);
  }

  async function handleGoogleCredential(credential: string) {
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await auth.googleLogin(credential);
      setToken(access_token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  const googleBlock = GOOGLE_ENABLED ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 11 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span>OR</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <GoogleLogin
          onSuccess={(r) => r.credential && handleGoogleCredential(r.credential)}
          onError={() => setError("Google sign-in was cancelled or failed")}
          theme="filled_black"
          size="large"
          text="continue_with"
          shape="rectangular"
        />
      </div>
    </div>
  ) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { access_token } = await auth.login(identifier, password);
        setToken(access_token);
        onLogin();
      } else if (mode === "create_workspace") {
        const result = await auth.signup(username, email, password, "create", companyName);
        setPendingEmail(result.email);
      } else if (mode === "join_workspace") {
        const result = await auth.signup(username, email, password, "join");
        setPendingEmail(result.email);
      } else {
        // forgot
        await auth.forgotPassword(email);
        setResetSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  // After signup — "check your email" screen
  if (pendingEmail) {
    return (
      <Shell>
        <div style={{ fontSize: 40, textAlign: "center" }}>📬</div>
        <h2 style={{ margin: 0, fontSize: 20, textAlign: "center" }}>Check your email</h2>
        <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 14, lineHeight: 1.6, textAlign: "center" }}>
          We sent a verification link to<br />
          <strong style={{ color: "var(--fg)" }}>{pendingEmail}</strong>
        </p>
        <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 13, textAlign: "center" }}>
          Click the link to activate your account. The link expires in 24 hours.
        </p>
        <button type="button" onClick={() => switchMode("signin")} style={{ marginTop: 8 }}>
          Back to sign in
        </button>
      </Shell>
    );
  }

  // After forgot-password submit
  if (resetSent) {
    return (
      <Shell>
        <div style={{ fontSize: 40, textAlign: "center" }}>📨</div>
        <h2 style={{ margin: 0, fontSize: 20, textAlign: "center" }}>Check your email</h2>
        <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 14, lineHeight: 1.6, textAlign: "center" }}>
          If an account exists for that email, we sent a password reset link.
        </p>
        <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 13, textAlign: "center" }}>
          The link expires in 1 hour. Didn't get it? Check spam or request a new one.
        </p>
        <button type="button" onClick={() => switchMode("signin")} style={{ marginTop: 8 }}>
          Back to sign in
        </button>
      </Shell>
    );
  }

  // Forgot-password form
  if (mode === "forgot") {
    return (
      <Shell>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Reset your password</h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>
            Enter your account email — we'll send you a reset link.
          </p>
        </div>
        {error && <div className="banner warn" style={{ marginBottom: 0, fontSize: 13 }}>{error}</div>}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email" placeholder="you@yourcompany.com" />
          </Field>
          <button type="submit" disabled={loading || !email} style={{ marginTop: 4 }}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          <LinkBtn onClick={() => switchMode("signin")}>Back to sign in</LinkBtn>
        </div>
      </Shell>
    );
  }

  // Sign in
  if (mode === "signin") {
    return (
      <Shell>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, letterSpacing: "0.02em" }}>Pulse</h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>
            Organizational memory for your team
          </p>
        </div>

        {error && <div className="banner warn" style={{ marginBottom: 0, fontSize: 13 }}>{error}</div>}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Username or Email">
            <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" disabled={loading} placeholder="amal_mathew or you@company.com" />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" disabled={loading} placeholder="••••••••" />
          </Field>
          <div style={{ textAlign: "right", marginTop: -8 }}>
            <LinkBtn onClick={() => switchMode("forgot")}>Forgot password?</LinkBtn>
          </div>
          <button type="submit" disabled={loading || !identifier || !password} style={{ marginTop: 4 }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {googleBlock}

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginBottom: 4 }}>New to Pulse?</div>
          <button type="button" onClick={() => switchMode("create_workspace")} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--fg)" }}>
            Create a workspace for my company
          </button>
          <button type="button" onClick={() => switchMode("join_workspace")} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--fg)" }}>
            Join my company's existing workspace
          </button>
        </div>
      </Shell>
    );
  }

  // create_workspace or join_workspace
  const isCreate = mode === "create_workspace";
  const heading = isCreate ? "Create workspace" : "Join your workspace";
  const subtitle = isCreate
    ? "You'll be the admin of your company's Pulse workspace."
    : "Your company already has a workspace. We'll add you to it.";
  const submitLabel = loading
    ? (isCreate ? "Creating workspace…" : "Joining workspace…")
    : (isCreate ? "Create workspace" : "Join workspace");
  const disabled = loading || !username || !email || !password || (isCreate && !companyName);

  return (
    <Shell>
      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>{heading}</h1>
        <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>{subtitle}</p>
      </div>

      {error && <div className="banner warn" style={{ marginBottom: 0, fontSize: 13 }}>{error}</div>}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {isCreate && (
          <Field label="Company Name" hint="The display name for your workspace.">
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required maxLength={256} disabled={loading} placeholder="Acme Corp" />
          </Field>
        )}
        <Field label="Username">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={64} autoComplete="username" disabled={loading} placeholder="Choose a username" />
        </Field>
        <Field
          label="Work Email"
          hint={isCreate
            ? "Use your company email. Your domain becomes your workspace identity."
            : "Must match your company's domain. Generic email providers are blocked."}
        >
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" disabled={loading} placeholder="you@yourcompany.com" />
        </Field>
        <Field label="Password">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" disabled={loading} placeholder="At least 8 characters" />
        </Field>
        <button type="submit" disabled={disabled} style={{ marginTop: 4 }}>{submitLabel}</button>
      </form>

      {googleBlock}

      <div style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
        {isCreate ? (
          <>Joining an existing workspace? <LinkBtn onClick={() => switchMode("join_workspace")}>Join instead</LinkBtn></>
        ) : (
          <>Setting up Pulse for your company? <LinkBtn onClick={() => switchMode("create_workspace")}>Create workspace</LinkBtn></>
        )}
        <div style={{ marginTop: 8 }}>
          Already have an account? <LinkBtn onClick={() => switchMode("signin")}>Sign in</LinkBtn>
        </div>
      </div>
    </Shell>
  );
}

// ---------- helpers ----------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px 48px", width: 400, display: "flex", flexDirection: "column", gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, display: "block" }}>{hint}</span>}
    </div>
  );
}

function LinkBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ background: "none", border: "none", color: "var(--accent, #4f8bff)", cursor: "pointer", padding: 0, fontSize: 13 }}>
      {children}
    </button>
  );
}
