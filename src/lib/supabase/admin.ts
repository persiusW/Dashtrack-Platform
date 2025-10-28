import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Note: The `process.env` values are only available on the server side.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn("Supabase URL is not set. Please update your .env.local file.");
}
if (!supabaseServiceRoleKey) {
  console.warn(
    "Supabase Service Role Key is not set. Please update your .env.local file."
  );
}

// Using a function to create the client ensures that the environment variables
// are evaluated at the time of the first call, not at module load time.
// A simple memoization pattern is used to avoid creating multiple clients.
let adminClient: SupabaseClient<Database> | null = null;

export const createSupabaseAdminClient = () => {
  if (adminClient) {
    return adminClient;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase URL or Service Role Key is not set. Cannot create admin client."
    );
  }

  adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
};

// Export a singleton instance for convenience
export const supabaseAdmin = createSupabaseAdminClient();
