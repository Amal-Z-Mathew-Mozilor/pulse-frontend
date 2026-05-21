import { useEffect, useState } from "react";
import {
  api,
  JiraAccount,
  JiraAccountCreate,
  JiraAccountTestResult,
} from "../api";

type FormState = {
  label: string;
  base_url: string;
  email: string;
  api_token: string;
  webhook_secret: string;
  is_active: boolean;
  is_default: boolean;
};

const EMPTY_FORM: FormState = {
  label: "",
  base_url: "",
  email: "",
  api_token: "",
  webhook_secret: "",
  is_active: true,
  is_default: false,
};

export default function JiraAccounts() {
  const [accounts, setAccounts] = useState<JiraAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publicBaseUrl, setPublicBaseUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Create form is a separate panel below the list.
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [createBusy, setCreateBusy] = useState(false);

  // Per-account inline editor.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editBusy, setEditBusy] = useState(false);

  // Per-account test result.
  const [testResults, setTestResults] = useState<Record<number, JiraAccountTestResult>>({});
  const [testingId, setTestingId] = useState<number | null>(null);

  async function load() {
    try {
      const rows = await api.jiraAccounts.list();
      setAccounts(rows);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Pull the public base URL so we can render full webhook URLs with copy buttons.
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setPublicBaseUrl(s.public_base_url || null))
      .catch(() => setPublicBaseUrl(null));
  }, []);

  function buildWebhookUrl(account: JiraAccount): string {
    const path = `/jira-webhook/${account.id}?token=${account.has_webhook_secret ? "<your-secret>" : "<SECRET-NOT-SET>"}`;
    return publicBaseUrl ? `${publicBaseUrl}${path}` : path;
  }

  async function copyWebhookUrl(account: JiraAccount) {
    const url = buildWebhookUrl(account);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(account.id);
      setTimeout(() => setCopiedId((cur) => (cur === account.id ? null : cur)), 1500);
    } catch {
      // Clipboard API requires HTTPS in some browsers. Fallback: select-and-copy via prompt.
      window.prompt("Copy the webhook URL below:", url);
    }
  }

  function startEdit(account: JiraAccount) {
    setEditingId(account.id);
    setEditForm({
      label: account.label,
      base_url: account.base_url,
      email: account.email,
      api_token: "",           // blank = keep existing
      webhook_secret: "",      // blank = keep existing
      is_active: account.is_active,
      is_default: account.is_default,
    });
    setErrorMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateBusy(true);
    setErrorMsg(null);
    try {
      const body: JiraAccountCreate = {
        label: createForm.label.trim(),
        base_url: createForm.base_url.trim(),
        email: createForm.email.trim(),
        api_token: createForm.api_token,
        webhook_secret: createForm.webhook_secret || undefined,
        is_active: createForm.is_active,
        is_default: createForm.is_default,
      };
      await api.jiraAccounts.create(body);
      setCreateForm(EMPTY_FORM);
      setCreating(false);
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreateBusy(false);
    }
  }

  async function submitEdit(id: number, e: React.FormEvent) {
    e.preventDefault();
    setEditBusy(true);
    setErrorMsg(null);
    try {
      await api.jiraAccounts.update(id, {
        label: editForm.label,
        base_url: editForm.base_url,
        email: editForm.email,
        api_token: editForm.api_token || undefined,         // blank = keep
        webhook_secret: editForm.webhook_secret || undefined,
        is_active: editForm.is_active,
        is_default: editForm.is_default,
      });
      cancelEdit();
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditBusy(false);
    }
  }

  async function deleteAccount(account: JiraAccount) {
    const confirmed = window.confirm(
      `Delete account "${account.label}"?\n\n` +
        `This removes all projects and ticket cache under this Jira workspace.\n` +
        `Features (organizational memory) are preserved but become detached.\n` +
        `Cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      await api.jiraAccounts.delete(account.id);
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function testAccount(account: JiraAccount) {
    setTestingId(account.id);
    try {
      const result = await api.jiraAccounts.test(account.id);
      setTestResults((prev) => ({ ...prev, [account.id]: result }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [account.id]: {
          ok: false,
          status_code: null,
          message: err instanceof Error ? err.message : "test failed",
        },
      }));
    } finally {
      setTestingId(null);
    }
  }

  return (
    <>
      <h2>Jira Accounts</h2>
      <p className="page-sub">
        Each row is a connected Jira workspace. Tokens are encrypted at rest and never
        leave the server. Add multiple accounts here to track projects across more than one
        Atlassian instance.
      </p>

      {errorMsg && (
        <div className="banner warn" style={{ marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}

      {loading && <div className="empty">Loading…</div>}

      {!loading && accounts.length === 0 && (
        <div className="empty">
          No Jira accounts configured yet. Click <em>Add account</em> below.
        </div>
      )}

      {accounts.map((a) => {
        const isEditing = editingId === a.id;
        const test = testResults[a.id];
        return (
          <div className="card" key={a.id}>
            <div className="row">
              <strong>{a.label}</strong>
              <span className="muted">{a.base_url}</span>
              <div className="spacer" />
              {a.is_default && (
                <span className="badge active" title="Default account — webhooks and unscoped operations route here">
                  default
                </span>
              )}
              <span className={`badge${a.is_active ? " active" : ""}`}>
                {a.is_active ? "active" : "disabled"}
              </span>
              <span className="badge" title={a.has_token ? "API token stored" : "no token"}>
                {a.has_token ? "token ✓" : "token ✗"}
              </span>
              <span className="badge" title={a.has_webhook_secret ? "webhook secret stored" : "no webhook secret"}>
                {a.has_webhook_secret ? "secret ✓" : "secret ✗"}
              </span>
              {!isEditing && (
                <>
                  <button
                    className="secondary"
                    onClick={() => testAccount(a)}
                    disabled={testingId === a.id}
                    title="Ping /rest/api/3/myself to verify credentials"
                  >
                    {testingId === a.id ? "Testing…" : "Test"}
                  </button>
                  <button className="secondary" onClick={() => startEdit(a)}>
                    Edit
                  </button>
                  <button className="secondary" onClick={() => deleteAccount(a)}>
                    Delete
                  </button>
                </>
              )}
            </div>

            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              Email: {a.email}
            </div>

            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="muted" style={{ fontFamily: "inherit" }}>
                Webhook URL:
              </span>
              <code style={{ flex: 1, overflowX: "auto", whiteSpace: "nowrap" }}>
                {buildWebhookUrl(a)}
              </code>
              <button
                className="secondary"
                style={{ fontSize: 11, padding: "2px 10px" }}
                onClick={() => copyWebhookUrl(a)}
                title="Copy this URL — paste into Jira Settings → System → Webhooks"
              >
                {copiedId === a.id ? "Copied ✓" : "Copy"}
              </button>
            </div>
            {!publicBaseUrl && (
              <div
                className="muted"
                style={{ marginTop: 4, fontSize: 11, fontStyle: "italic" }}
              >
                Tip: set PULSE_PUBLIC_BASE_URL in <code>.env</code> (e.g. your ngrok or
                production URL) so this row shows the full URL ready to paste.
              </div>
            )}
            {!a.has_webhook_secret && (
              <div
                className="banner warn"
                style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}
              >
                No webhook secret set — incoming webhooks will be rejected. Click <em>Edit</em>
                {" "}and add one, then paste it into Jira's webhook config.
              </div>
            )}

            {test && (
              <div
                className={`banner${test.ok ? "" : " warn"}`}
                style={{ marginTop: 10, marginBottom: 0, fontSize: 13 }}
              >
                {test.ok
                  ? `✓ Connected as ${test.user_displayname || test.user_email || "Jira user"}.`
                  : `✗ ${test.message}${test.status_code ? ` (HTTP ${test.status_code})` : ""}`}
              </div>
            )}

            {isEditing && (
              <form
                onSubmit={(e) => submitEdit(a.id, e)}
                style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}
              >
                <AccountFormFields form={editForm} setForm={setEditForm} mode="edit" />
                <div className="row">
                  <button type="submit" disabled={editBusy}>
                    {editBusy ? "Saving…" : "Save"}
                  </button>
                  <button type="button" className="secondary" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 24 }}>
        {!creating && (
          <button onClick={() => { setCreating(true); setCreateForm(EMPTY_FORM); setErrorMsg(null); }}>
            + Add account
          </button>
        )}
        {creating && (
          <div className="card">
            <strong>New Jira account</strong>
            <form
              onSubmit={submitCreate}
              style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}
            >
              <AccountFormFields form={createForm} setForm={setCreateForm} mode="create" />
              <div className="row">
                <button type="submit" disabled={createBusy}>
                  {createBusy ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => { setCreating(false); setCreateForm(EMPTY_FORM); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}


function AccountFormFields({
  form,
  setForm,
  mode,
}: {
  form: FormState;
  setForm: (next: FormState) => void;
  mode: "create" | "edit";
}) {
  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm({ ...form, [key]: value });
  }
  return (
    <>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Label</label>
        <input
          type="text"
          value={form.label}
          onChange={(e) => update("label", e.target.value)}
          placeholder="e.g. Mozilor Main"
          required
          maxLength={128}
        />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Base URL</label>
        <input
          type="url"
          value={form.base_url}
          onChange={(e) => update("base_url", e.target.value)}
          placeholder="https://your-workspace.atlassian.net"
          required
        />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Service email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="service@example.com"
          required
        />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>
          API token{" "}
          {mode === "edit" && (
            <span className="muted" style={{ fontSize: 12 }}>
              (leave blank to keep existing)
            </span>
          )}
        </label>
        <input
          type="password"
          value={form.api_token}
          onChange={(e) => update("api_token", e.target.value)}
          placeholder={mode === "edit" ? "••••••••" : "Atlassian API token"}
          required={mode === "create"}
          autoComplete="off"
        />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>
          Webhook secret{" "}
          <span className="muted" style={{ fontSize: 12 }}>
            (optional — used to route incoming webhooks to this account)
          </span>
        </label>
        <input
          type="text"
          value={form.webhook_secret}
          onChange={(e) => update("webhook_secret", e.target.value)}
          placeholder={mode === "edit" ? "leave blank to keep existing" : "any string Jira will send as ?token=..."}
          autoComplete="off"
        />
      </div>
      <div className="row" style={{ gap: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          Active (included in sync)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => update("is_default", e.target.checked)}
          />
          Default account
        </label>
      </div>
    </>
  );
}
