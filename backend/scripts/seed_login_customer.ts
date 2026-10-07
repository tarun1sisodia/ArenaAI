import { createClient } from "@supabase/supabase-js";
import { authenticateRequest } from "../src/middlewares/authGuard.js";
import { loadEnv } from "../src/config/env.js";

try {
  process.loadEnvFile?.(".env");
} catch {}

const env = loadEnv(process.env);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

const { data, error } = await sb.auth.signInWithPassword({
  email: "[EMAIL_ADDRESS]",
  password: "[PASSWORD]",
});

if (error || !data.session) {
  console.error("Sign-in failed:", error);
  process.exit(1);
}

console.log("✅ Sign-in successful! User ID:", data.user?.id);

const mockRequest = {
  headers: {
    authorization: `Bearer ${data.session.access_token}`,
  },
} as any;

const authenticated = await authenticateRequest(mockRequest, env);
console.log("✅ Backend authGuard verified principal:", authenticated);
