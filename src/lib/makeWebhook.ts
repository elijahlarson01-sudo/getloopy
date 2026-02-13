import { supabase } from "@/integrations/supabase/client";

type MakeEvent = "challenge_completed" | "onboarding_completed" | "weekly_leaderboard";

export const sendMakeWebhook = async (eventType: MakeEvent, payload: Record<string, any>) => {
  try {
    console.log(`Sending ${eventType} event to Make.com via edge function`);
    const { data, error } = await supabase.functions.invoke("make-webhook", {
      body: { event_type: eventType, payload },
    });

    if (error) {
      console.error("Make webhook error:", error);
      return;
    }

    console.log("Make webhook response:", data);
  } catch (err) {
    // Silent fail - webhook errors shouldn't break the app
    console.error("Make webhook failed:", err);
  }
};
