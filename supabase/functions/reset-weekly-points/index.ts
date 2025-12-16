import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting weekly points reset...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Reset all users' weekly_mastery_points to 0 and update the reset date
    const { data, error } = await supabase
      .from("user_progress")
      .update({
        weekly_mastery_points: 0,
        weekly_points_reset_date: new Date().toISOString().split("T")[0],
      })
      .neq("weekly_mastery_points", 0); // Only update rows that have points

    if (error) {
      console.error("Error resetting weekly points:", error);
      throw error;
    }

    console.log("Weekly points reset completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Weekly points reset completed",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in reset-weekly-points:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
