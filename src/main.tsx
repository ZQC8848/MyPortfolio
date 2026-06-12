import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

// Note: StrictMode is intentionally omitted. Its dev-mode double-mount
// force-loses the R3F WebGL context on this canvas without restoring it,
// leaving the particle background permanently blank (three.js "Context Lost").
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
