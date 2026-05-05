import { createSupabaseClient } from "app/utils/supabase.server";
import { authenticate } from "app/shopify.server";
import { ActionFunctionArgs } from "react-router";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await authenticate.admin(request);

  const { supabase } = createSupabaseClient();

  const body = await request.json().catch(() => null);

  if (!params || !params.id || typeof +params.id !== "number")
    return new Response(
      JSON.stringify({ error: "Invalid time entry id provided" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );

  const id = +params.id;

  if (request.method === "PATCH") {
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(body);

    const { clockIn: clock_in, notes, clockOut: clock_out } = body;
    console.log("clock in:", clock_in);
    console.log("clock out:", clock_out);
    const updateData = !clock_out
      ? { clock_in, notes }
      : { clock_in, notes, clock_out };

    console.log(updateData);

    const { data, error } = await supabase
      .from("time_entries")
      .update(updateData)
      .eq("id", id)
      .select();

    console.log("entry updated");
    console.log(data);

    if (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to update entry: ${JSON.stringify(error)}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, updated_entry: data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } else if (request.method === "DELETE") {
    console.log("delete req");
    const { error } = await supabase.from("time_entries").delete().eq("id", id);
    if (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to delete entry: ${JSON.stringify(error)}`,
        }),
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
  } else {
    return new Response(JSON.stringify({ error: "Invalid request method" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
