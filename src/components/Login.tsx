import { useState } from "react";
import { auth, setToken } from "../api";

type Mode = "signin" | "create_workspace" | "join_workspace";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPendingEmail(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { access_token } = await auth.login(username, password);
        setToken(access_token);
        onLogin();
      } else if (mode === "create_workspace") {
        const result = await auth.signup(username, email, password, "create", companyName);
        setPendingEmail(result.email);
      } else {
        // join_workspace
        const result = await auth.signup(username, email, password, "join");
        setPendingEmail(result.email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  // "Check your email" screen after successful signup
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

  // Pick-a-flow chooser screen (initial signup landing)
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
          <Field label="Username">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" disabled={loading} placeholder="amal_mathew" />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" disabled={loading} placeholder="••••••••" />
          </Field>
          <button type="submit" disabled={loading || !username || !password} style={{ marginTop: 4 }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

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
        <h1 style={{ margin: 0, fontSize: 22, letterSpacing: "0.02em" }}>{heading}</h1>
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

      <div style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
        {isCreate ? (
          <>
            Joining an existing workspace?{" "}
            <LinkBtn onClick={() => switchMode("join_workspace")}>Join instead</LinkBtn>
          </>
        ) : (
          <>
            Setting up Pulse for your company?{" "}
            <LinkBtn onClick={() => switchMode("create_workspace")}>Create workspace</LinkBtn>
          </>
        )}
        <div style={{ marginTop: 8 }}>
          Already have an account?{" "}
          <LinkBtn onClick={() => switchMode("signin")}>Sign in</LinkBtn>
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
