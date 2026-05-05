// app/routes/app.preferences.tsx
import type { ActionFunctionArgs } from "react-router";
import { createSupabaseClient } from "../utils/supabase.server"; // whatever your path is
import { authenticate } from "../shopify.server"; // typical Shopify helper

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request); // enforce Shopify auth if needed

  const { supabase } = createSupabaseClient();

  // Assume JSON payload from client
  const body = await request.json().catch(() => null);

  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { entryId, now } = body;

  const { data, error } = await supabase
    .from("time_entries")
    .update({ clock_out: now })
    .eq("id", entryId);

  if (error) {
    return new Response(
      JSON.stringify({ error: `Failed to clock out: ${error}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
