import ws from "ws";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export const createSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL");
  }

  if (!secretKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient<Database>(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      transport: ws as any,
    },
  });

  return { supabase };
};
