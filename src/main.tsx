import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/print.css";

// Check if root element exists
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure index.html has a div with id='root'");
}

// Create root and render app
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Log successful mount
if (import.meta.env.DEV) {
  console.log("✅ Estre Configurator loaded successfully");
}
