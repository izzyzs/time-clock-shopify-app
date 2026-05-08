import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createSupabaseClient } from "../utils/supabase.server"; // whatever your path is
import { authenticate } from "../shopify.server"; // typical Shopify helper
import bcrypt from "bcrypt";
import { getCorsHeaders, handleCorsPreflight } from "app/utils/cors.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        ...getCorsHeaders(request),
        Allow: "GET, POST, DELETE, OPTIONS",
      },
    });
  }

  const { session } = await authenticate.admin(request);

  const { supabase } = createSupabaseClient();

  const { data, error: retrievalError } = await supabase.rpc(
    "get_current_clock_status",
    { p_shop: session.shop },
  );

  if (retrievalError)
    return new Response(
      JSON.stringify({
        error: `Failed to retrieve employees: ${JSON.stringify(retrievalError, null, 2)}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );

  if (!data)
    return new Response(JSON.stringify({ message: "No employees exist" }), {
      status: 203,
      headers: {
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });

  return new Response(JSON.stringify({ employees: data }), {
    status: 200,
    headers: { ...getCorsHeaders(request), "Content-Type": "application/json" },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request); // enforce Shopify auth if needed

  const { supabase } = createSupabaseClient();

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
  if (request.method === "POST") {
    console.log("request", request);
    console.log("body", body);
    const { firstName, lastName, code, pin } = body;
    const hash = await bcrypt.hash(pin, 10);
    const { error } = await supabase.from("employees").upsert(
      {
        code,
        first_name: firstName,
        last_name: lastName,
        pin_hash: hash,
        shop: session.shop,
      },
      { onConflict: "code", ignoreDuplicates: true },
    );

    if (error)
      return new Response(
        JSON.stringify({
          error: `failed to create employee; ${JSON.stringify(error, null, 2)}`,
          originalBody: body,
        }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(request),
            "Content-Type": "application/json",
          },
        },
      );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });
  } else if (request.method === "DELETE") {
    console.log("method === DELETE");
    const { id } = body;
    console.log(`id: ${JSON.stringify(+id)}, type: ${typeof +id}`);
    const { data, error } = await supabase
      .from("employees")
      .delete()
      .eq("id", +id)
      .eq("shop", session.shop)
      .select();
    //   .single();
    console.log(`data: ${JSON.stringify(data)}`);
    console.log(`error: ${JSON.stringify(error)}`);
    if (error || !data)
      return new Response(
        JSON.stringify({
          error: `Employee delete failed: ${JSON.stringify(error, null, 2)}`,
        }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(request),
            "Content-Type": "application/json",
          },
        },
      );
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });
  }
};
