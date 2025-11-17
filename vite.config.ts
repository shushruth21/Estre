import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "module";

// Helper to safely get componentTagger if available
// lovable-tagger is an optional dev tool, so we handle it gracefully
function getComponentTagger() {
  try {
    const require = createRequire(import.meta.url);
    return require("lovable-tagger").componentTagger;
  } catch {
    // Package not available - return null (this is fine)
    return null;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const componentTagger = mode === 'development' ? getComponentTagger() : null;
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      componentTagger ? componentTagger() : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
            ],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
