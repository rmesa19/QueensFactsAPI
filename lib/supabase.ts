import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use the **service role key** only in server environments (middleware, API routes).
export const supabase = createClient(supabaseUrl, supabaseServiceKey);