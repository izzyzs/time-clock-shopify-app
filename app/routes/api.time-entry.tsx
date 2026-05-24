import { authenticate } from "app/shopify.server";
import { CreateTimeLogReportArgs } from "app/types";
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

  // const { data, error: retrievalError } = await supabase
  //   .from("time_entries")
  //   .select("*")
  //   .eq("shop", session.shop);

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const startDateParam = searchParams.get("start_date");
  const endDateParam = searchParams.get("end_date");
  const idParam = searchParams.get("employee_id");

  const startDate =
    startDateParam && startDateParam !== null ? startDateParam : undefined;
  const endDate =
    endDateParam && endDateParam !== null ? endDateParam : undefined;
  const employeeID = idParam ? +idParam : undefined;

  const args: CreateTimeLogReportArgs = {
    p_shop: session.shop,
    p_start_date: startDate,
    p_end_date: endDate,
    p_employee_id: employeeID,
  };

  const { data, error: retrievalError } = await supabase.rpc(
    "create_time_log_report",
    args,
  );
  if (retrievalError)
    return new Response(
      JSON.stringify({
        error: `Failed to retrieve entries, postgres error: ${JSON.stringify(retrievalError, null, 2)}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );

  if (!data)
    return new Response(JSON.stringify({ message: "No time entries exist" }), {
      status: 203,
      headers: { "Content-Type": "application/json" },
    });

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
