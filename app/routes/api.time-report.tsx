import { type LoaderFunctionArgs } from "react-router";
import { createSupabaseClient } from "../utils/supabase.server"; // whatever your path is
import { authenticate } from "../shopify.server"; // typical Shopify helper
import { hasRequiredKeys } from "app/lib/helpers";
import { CreateReportArgs } from "app/types";
import { getCorsHeaders, handleCorsPreflight } from "app/utils/cors.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "GET")
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...getCorsHeaders(request), Allow: "GET" },
    });

  const { session } = await authenticate.admin(request); // enforce Shopify auth if needed

  const { supabase } = createSupabaseClient();

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // this is necessary if a start and end date are considered necessary. this will require
  //  removing proc null default values for the parameters

  ////////   const requiredKeys = ["p_start_date", "p_end_date"];

  ////////   if (!searchParams && !hasRequiredKeys(searchParams, requiredKeys)) {
  ////////     return new Response(JSON.stringify({ error: "Invalid params" }), {
  ////////       status: 400,
  ////////       headers: { "Content-Type": "application/json" },
  ////////     });
  ////////   }

  const startDateParam = searchParams.get("start_date");
  const endDateParam = searchParams.get("end_date");
  const idParam = searchParams.get("employee_id");

  const startDate =
    startDateParam && startDateParam !== null ? startDateParam : undefined;
  const endDate =
    endDateParam && endDateParam !== null ? endDateParam : undefined;
  const employeeID = idParam ? +idParam : undefined;

  const args: CreateReportArgs = {
    p_shop: session.shop,
    p_start_date: startDate,
    p_end_date: endDate,
    p_employee_id: employeeID,
  };

  const { data, error } = await supabase.rpc("create_time_report", args);

  if (error) {
    return new Response(
      JSON.stringify({ error: `Postgres Error: ${JSON.stringify(error)}` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (!data) {
    return new Response(JSON.stringify({ message: "No matches for query." }), {
      status: 204,
    });
  }
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
