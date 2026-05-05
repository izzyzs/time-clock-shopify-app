import type { ActionFunctionArgs } from "react-router";
import { createClient } from "../utils/supabase.server"; // whatever your path is
import { authenticate } from "../shopify.server"; // typical Shopify helper
import bcrypt from "bcrypt";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request); // enforce Shopify auth if needed

  const { supabase } = createClient(request);

  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (request.method === "POST") {
    const { firstName, lastName, code, pin } = body;
    const hash = await bcrypt.hash(pin, 10);
    const { error } = await supabase
      .from("employees")
      .upsert(
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
          headers: { "Content-Type": "application/json" },
        },
      );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
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
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
