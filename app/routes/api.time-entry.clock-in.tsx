// app/routes/app.preferences.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createSupabaseClient } from "../utils/supabase.server"; // whatever your path is
import { authenticate } from "../shopify.server"; // typical Shopify helper
import bcrypt from "bcrypt";
import { getCorsHeaders, handleCorsPreflight } from "app/utils/cors.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { ...getCorsHeaders(request), Allow: "POST" },
  });
}

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

  const { selectedEmployeeId: employeeId, pin, now } = body;

  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .eq("shop", session.shop)
    .single();

  if (!employeeData)
    return new Response(JSON.stringify({ error: "Employee doesn't exist" }), {
      status: 400,
      headers: {
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });

  if (employeeError)
    return new Response(
      JSON.stringify({
        error: `Failed to retrieve employee: ${JSON.stringify(employeeError)}`,
      }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(request),
          "Content-Type": "application/json",
        },
      },
    );

  console.log("pin", pin);

  const isValidPin = await bcrypt.compare(pin, employeeData.pin_hash);

  if (!isValidPin)
    return new Response(JSON.stringify({ error: "Invalid pin" }), {
      status: 400,
      headers: {
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });

  const { error: insertError } = await supabase.from("time_entries").insert({
    employee_id: employeeData.id,
    clock_in: now,
    shop: session.shop,
  });

  if (insertError) {
    return new Response(
      JSON.stringify({
        error: `Failed to clock in: ${JSON.stringify(insertError)}`,
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
