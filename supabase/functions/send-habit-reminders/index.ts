import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeviceToken {
  user_id: string;
  token: string;
}

interface Habit {
  id: string;
  name: string;
  user_id: string;
}

interface HabitCompletion {
  habit_id: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");

    if (!firebaseServerKey) {
      console.error("FIREBASE_SERVER_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Firebase not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    console.log(`Checking incomplete habits for date: ${today}`);

    // Get all users with device tokens
    const { data: deviceTokens, error: tokensError } = await supabase
      .from("device_tokens")
      .select("user_id, token");

    if (tokensError) {
      console.error("Error fetching device tokens:", tokensError);
      throw tokensError;
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      console.log("No device tokens found");
      return new Response(
        JSON.stringify({ message: "No devices to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${deviceTokens.length} device tokens`);

    // Group tokens by user
    const userTokens = new Map<string, string[]>();
    (deviceTokens as DeviceToken[]).forEach((dt) => {
      if (!userTokens.has(dt.user_id)) {
        userTokens.set(dt.user_id, []);
      }
      userTokens.get(dt.user_id)!.push(dt.token);
    });

    const notifications: Promise<Response>[] = [];

    // For each user, check if they have incomplete habits
    for (const [userId, tokens] of userTokens) {
      // Get user's habits
      const { data: habits, error: habitsError } = await supabase
        .from("habits")
        .select("id, name, user_id")
        .eq("user_id", userId);

      if (habitsError) {
        console.error(`Error fetching habits for user ${userId}:`, habitsError);
        continue;
      }

      if (!habits || habits.length === 0) {
        continue;
      }

      // Get today's completions for this user
      const { data: completions, error: completionsError } = await supabase
        .from("habit_completions")
        .select("habit_id")
        .eq("user_id", userId)
        .eq("date", today)
        .eq("completed", true);

      if (completionsError) {
        console.error(`Error fetching completions for user ${userId}:`, completionsError);
        continue;
      }

      const completedHabitIds = new Set((completions as HabitCompletion[] || []).map((c) => c.habit_id));
      const incompleteHabits = (habits as Habit[]).filter((h) => !completedHabitIds.has(h.id));

      if (incompleteHabits.length === 0) {
        console.log(`User ${userId} has completed all habits`);
        continue;
      }

      console.log(`User ${userId} has ${incompleteHabits.length} incomplete habits`);

      // Send notification to all user's devices
      const habitNames = incompleteHabits.slice(0, 3).map((h) => h.name).join(", ");
      const moreCount = incompleteHabits.length > 3 ? ` and ${incompleteHabits.length - 3} more` : "";

      const message = {
        notification: {
          title: "⏰ Habit Reminder",
          body: `You have ${incompleteHabits.length} incomplete task${incompleteHabits.length > 1 ? "s" : ""}: ${habitNames}${moreCount}`,
        },
        data: {
          type: "habit_reminder",
          incomplete_count: String(incompleteHabits.length),
        },
      };

      for (const token of tokens) {
        notifications.push(
          fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `key=${firebaseServerKey}`,
            },
            body: JSON.stringify({
              to: token,
              ...message,
            }),
          })
        );
      }
    }

    // Wait for all notifications to be sent
    const results = await Promise.allSettled(notifications);
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Sent ${successful} notifications, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: "Reminders sent",
        successful,
        failed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-habit-reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
