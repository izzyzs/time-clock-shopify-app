// import {
//   createServerClient,
//   parseCookieHeader,
//   serializeCookieHeader,
// } from "@supabase/ssr";
// import { Database } from "./database.types";

// export function createClient(request: Request) {
//   const headers = new Headers();

//   const supabase = createServerClient<Database>(
//     process.env.VITE_SUPABASE_URL!,
//     process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return parseCookieHeader(request.headers.get("Cookie") ?? "") as {
//             name: string;
//             value: string;
//           }[];
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             headers.append(
//               "Set-Cookie",
//               serializeCookieHeader(name, value, options),
//             ),
//           );
//         },
//       },
//       global: {
//         headers: {
//           "X-Client-Info": "server-no-realtime",
//         },
//       },
//     },
//   );

//   return { supabase, headers };
// }

import ws from "ws";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export const createSupabaseClient = () => {
  // const supabaseUrl = process.env.SUPABASE_URL;
  // const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
