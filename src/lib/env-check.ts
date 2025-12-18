/**
 * Validates that critical environment variables are present at runtime.
 * This runs before the React app mounts to ensure fail-fast behavior.
 */
export function validateEnv() {
    const missing: string[] = [];

    const requiredVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
    ];

    requiredVars.forEach(key => {
        if (!import.meta.env[key]) {
            missing.push(key);
        }
    });

    if (missing.length > 0) {
        const message = `CRITICAL ERROR: Missing required environment variables:\n${missing.join('\n')}\n\nThe application cannot start. Please check your .env file or deployment settings.`;
        console.error(message);

        // Create a blocking error overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = '#1a1a1a';
        overlay.style.color = '#ef4444'; // Red-500
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '2rem';
        overlay.style.zIndex = '99999';
        overlay.style.fontFamily = 'monospace';
        overlay.innerHTML = `
      <h1 style="font-size: 2rem; margin-bottom: 1rem;">Configuration Error</h1>
      <p style="text-align: center; max-width: 600px; line-height: 1.5;">
        The application is missing required environment variables.<br/>
        <strong>${missing.join(', ')}</strong>
      </p>
    `;

        document.body.appendChild(overlay);

        // Stop execution
        throw new Error(message);
    }

    console.log('✅ Environment verification passed');
}
