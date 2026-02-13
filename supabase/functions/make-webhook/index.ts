import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    if (!webhookUrl) {
      throw new Error("MAKE_WEBHOOK_URL not configured");
    }

    const body = await req.json();
    const { event_type, payload } = body;

    if (!event_type) {
      throw new Error("event_type is required");
    }

    console.log(`Sending ${event_type} event to Make.com`);

    // Enrich payload with user profile data if user_id is present
    let enrichedPayload = { ...payload };

    if (payload?.user_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", payload.user_id)
        .maybeSingle();

      if (profile) {
        enrichedPayload = { ...enrichedPayload, user_name: profile.full_name, user_email: profile.email };
      }
    }

    // Send to Make.com webhook
    const makeResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type,
        timestamp: new Date().toISOString(),
        ...enrichedPayload,
      }),
    });

    console.log(`Make.com response status: ${makeResponse.status}`);

    return new Response(
      JSON.stringify({ success: true, event_type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Make webhook error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
