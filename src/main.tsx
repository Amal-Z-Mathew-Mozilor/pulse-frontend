import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import VerifyEmail from "./components/VerifyEmail";
import "./styles.css";

const isVerifyRoute = window.location.pathname === "/verify-email";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isVerifyRoute ? <VerifyEmail /> : <App />}
  </React.StrictMode>,
);
