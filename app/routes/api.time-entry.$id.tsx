import { createSupabaseClient } from "app/utils/supabase.server";
import { authenticate } from "app/shopify.server";
import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Database } from "app/utils/database.types";
import { getCorsHeaders, handleCorsPreflight } from "app/utils/cors.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        ...getCorsHeaders(request),
        Allow: "GET, PATCH, DELETE, OPTIONS",
      },
    });
  }
  const { session } = await authenticate.admin(request);

  const { supabase } = createSupabaseClient();

  const body = await request.json().catch(() => null);

  if (!params || !params.id || typeof +params.id !== "number")
    return new Response(
      JSON.stringify({ error: "Invalid time entry id provided" }),
      {
        status: 400,
        headers: {
          ...getCorsHeaders(request),
          "Content-Type": "application/json",
        },
      },
    );

  const id = +params.id;

  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("id", id)
    .eq("shop", session.shop);

  if (error) {
    return new Response(
      JSON.stringify({
        error: `Failed to update retrieve entry ${id}: ${JSON.stringify(error)}`,
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

  if (!data)
    return new Response(
      JSON.stringify({ message: `Entry ${id} doesn't exist` }),
      {
        status: 204,
        headers: {
          ...getCorsHeaders(request),
          "Content-Type": "application/json",
        },
      },
    );

  return new Response(JSON.stringify({ entry: data }), {
    status: 200,
    headers: { ...getCorsHeaders(request), "Content-Type": "application/json" },
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await authenticate.admin(request);

  const { supabase } = createSupabaseClient();

  const body = await request.json().catch(() => null);

  if (!params || !params.id || typeof +params.id !== "number")
    return new Response(
      JSON.stringify({ error: "Invalid time entry id provided" }),
      {
        status: 400,
        headers: {
          ...getCorsHeaders(request),
          "Content-Type": "application/json",
        },
      },
    );

  const id = +params.id;

  if (request.method === "PATCH") {
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: {
          ...getCorsHeaders(request),
          "Content-Type": "application/json",
        },
      });
    }

    const { clockIn: clock_in, notes, clockOut: clock_out } = body;
    const updateData = !clock_out
      ? { clock_in, notes }
      : { clock_in, notes, clock_out };

    const { data, error } = await supabase
      .from("time_entries")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to update entry: ${JSON.stringify(error)}`,
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

    return new Response(
      JSON.stringify({ success: true, updated_entry: data }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          "Content-Type": "application/json",
        },
      },
    );
  } else if (request.method === "DELETE") {
    const { error } = await supabase.from("time_entries").delete().eq("id", id);
    if (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to delete entry: ${JSON.stringify(error)}`,
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
  } else {
    return new Response(JSON.stringify({ error: "Invalid request method" }), {
      status: 400,
      headers: {
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });
  }
};
