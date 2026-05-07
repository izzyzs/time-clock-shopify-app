import { authenticate } from "app/shopify.server";
import { getCorsHeaders, handleCorsPreflight } from "app/utils/cors.server";
import { createSupabaseClient } from "app/utils/supabase.server";
import { LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "GET")
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...getCorsHeaders(request), Allow: "GET" },
    });

  const { session } = await authenticate.admin(request);

  const { supabase } = createSupabaseClient();

  const { data, error: retrievalError } = await supabase
    .from("time_entries")
    .select("*")
    .eq("shop", session.shop);

  if (retrievalError)
    return new Response(
      JSON.stringify({
        error: `Failed to retrieve entries: ${JSON.stringify(retrievalError, null, 2)}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );

  if (!data)
    return new Response(JSON.stringify({ message: "No time entries exist" }), {
      status: 203,
      headers: { "Content-Type": "application/json" },
    });

  return new Response(JSON.stringify({ employees: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
