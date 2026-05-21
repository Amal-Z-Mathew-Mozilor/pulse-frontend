import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import VerifyEmail from "./components/VerifyEmail";
import ResetPassword from "./components/ResetPassword";
import "./styles.css";

const path = window.location.pathname;
const route = path === "/verify-email" ? "verify"
  : path === "/reset-password" ? "reset"
  : "app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {route === "verify" ? <VerifyEmail /> : route === "reset" ? <ResetPassword /> : <App />}
  </React.StrictMode>,
);
