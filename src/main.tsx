import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SchemaGuard } from "./components/SchemaGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import "./styles/print.css";
import { validateEnv } from "./lib/env-check";

// Validate environment before doing anything else
validateEnv();

// Check if root element exists
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure index.html has a div with id='root'");
}

// Create root and render app
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <SchemaGuard>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </SchemaGuard>
  </StrictMode>
);

// Log successful mount
if (import.meta.env.DEV) {
  console.log("✅ Estre Configurator loaded successfully");
}
