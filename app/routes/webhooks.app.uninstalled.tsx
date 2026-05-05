import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createSupabaseClient } from "app/utils/supabase.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  const { supabase } = createSupabaseClient();

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    // await db.session.deleteMany({ where: { shop } });
    const { error } = await supabase
      .from("shopify_sessions")
      .delete()
      .eq("shop", shop);
  }

  return new Response();
};
