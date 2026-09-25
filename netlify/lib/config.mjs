// Central configuration. Secrets come ONLY from environment variables.
// MCP endpoint URLs are not secrets, so sensible defaults are provided.
const env = (k, d = '') => (globalThis.process?.env?.[k] ?? d);

export const config = {
  groqKey: () => env('GROQ_API_KEY'),
  groqModel: () => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
  supabaseUrl: () => env('SUPABASE_URL'),
  supabaseKey: () => env('SUPABASE_ANON_KEY'),
  mcp: {
    policyLookup: () => env('MCP_POLICY_LOOKUP_URL', 'https://aparbatlearn.app.n8n.cloud/mcp/onboardai-policy-lookup'),
    policyIntelligence: () => env('MCP_POLICY_INTELLIGENCE_URL', 'https://aparbatlearn.app.n8n.cloud/mcp/onboardai-policy-intelligence'),
    onboardingProgress: () => env('MCP_ONBOARDING_PROGRESS_URL', 'https://aparbatlearn.app.n8n.cloud/mcp/onboardai-onboarding-progress'),
    newHireWelcome: () => env('MCP_NEW_HIRE_WELCOME_URL', 'https://aparbatlearn.app.n8n.cloud/mcp/onboardai-new-hire-welcome'),
  },
  mcpAuthHeader: () => env('MCP_AUTH_HEADER'), // optional "Name: value" shared secret
};
