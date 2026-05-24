import { authenticate } from "app/shopify.server";
import { CreateTimeLogReportArgs } from "app/types";
import { getCorsHeaders, handleCorsPreflight } from "app/utils/cors.server";
import { createSupabaseClient } from "app/utils/supabase.server";
import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "GET" && request.method !== "POST")
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...getCorsHeaders(request), Allow: "POST, GET" },
    });

  const { session } = await authenticate.admin(request); // enforce Shopify auth if needed

  const { supabase } = createSupabaseClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("shop", session.shop)
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: `Postgres Error: ${JSON.stringify(error)}` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (!data) {
    return new Response(
      JSON.stringify({ message: "No location matches for your shop." }),
      {
        status: 204,
      },
    );
  }
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request); // enforce Shopify auth if needed

  const { supabase } = createSupabaseClient();

  // Assume JSON payload from client
  const body = await request.json().catch(() => null);

  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: {
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });
  }

  const { location } = body;

  const { error: insertError } = await supabase.from("locations").insert({
    shop: session.shop,
    location,
  });

  if (insertError) {
    return new Response(
      JSON.stringify({
        error: `Failed to add location: ${JSON.stringify(insertError)}`,
      }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(request),
          "Content-Type": "application/json",
        },
      },
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      ...getCorsHeaders(request),
      "Content-Type": "application/json",
    },
  });
};
