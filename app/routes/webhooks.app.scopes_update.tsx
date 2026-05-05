import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createSupabaseClient } from "app/utils/supabase.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase } = createSupabaseClient();
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current as string[];
  if (session) {
    const { error } = await supabase
      .from("shopify_sessions")
      .update({ scope: current.toString() })
      .eq("id", session.id)
      .select();
  }
  return new Response();
};
