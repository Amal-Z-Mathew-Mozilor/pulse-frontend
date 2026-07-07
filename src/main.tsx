import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import VerifyEmail from "./components/VerifyEmail";
import ResetPassword from "./components/ResetPassword";
import "./styles.css";

// GA4 (gtag.js) is loaded as a static tag in index.html, immediately after the
// CookieYes script, as required by CookieYes's Google Consent Mode checker.
// Do NOT inject it from here — that loads too late for GCM validation.

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || "";

const path = window.location.pathname;
const route = path === "/verify-email" ? "verify"
  : path === "/reset-password" ? "reset"
  : "app";

const tree = (
  <>
    {route === "verify" ? <VerifyEmail /> : route === "reset" ? <ResetPassword /> : <App />}
    {/* Global cookie policy link — shown on every screen, incl. logged-out login. */}
    <a
      href="/cookie-policy"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed",
        bottom: 12,
        right: 16,
        fontSize: 11,
        opacity: 0.55,
        color: "inherit",
        zIndex: 1000,
      }}
    >
      Cookie Policy
    </a>
  </>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{tree}</GoogleOAuthProvider>
    ) : tree}
  </React.StrictMode>,
);
