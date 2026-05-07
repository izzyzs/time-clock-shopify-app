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

  const { entryId, selectedEmployeeId: employeeId, pin, now } = body;

  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("id, pin_hash")
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

  const isValidPin = await bcrypt.compare(pin, employeeData.pin_hash);

  if (!isValidPin) {
    return new Response(JSON.stringify({ error: `Incorrect pin.` }), {
      status: 400,
      headers: {
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });
  }

  if (!entryId) {
    const { data: timeEntryId, error: timeEntryError } = await supabase.rpc(
      "get_active_time_entry_id",
      { p_employee_id: employeeData.id, p_shop: session.shop },
    );
    // .from("time_entries")
    // .select("id")
    // .eq("employee_id", employeeData.id)
    // .eq("shop", session.shop)
    // .single();

    console.log("timeEntryId", timeEntryId);
    console.log("timeEntryError", timeEntryError);

    if (!timeEntryId)
      return new Response(JSON.stringify({ message: `Entry doesn't exist` }), {
        status: 203,
        headers: {
          ...getCorsHeaders(request),
          "Content-Type": "application/json",
        },
      });

    console.log("timeEntryId", timeEntryId);
    const { data, error } = await supabase
      .from("time_entries")
      .update({ clock_out: now })
      .eq("id", timeEntryId)
      .eq("shop", session.shop);

    if (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to clock out: ${JSON.stringify(error, null, 2)}`,
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
  }

  const { data, error } = await supabase
    .from("time_entries")
    .update({ clock_out: now })
    .eq("id", entryId)
    .eq("shop", session.shop);

  if (error) {
    return new Response(
      JSON.stringify({ error: `Failed to clock out: ${error}` }),
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
