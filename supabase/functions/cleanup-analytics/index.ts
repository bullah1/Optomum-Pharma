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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete marketing events older than 90 days
    const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { count: eventsDeleted } = await supabase
      .from("marketing_events")
      .delete({ count: "exact" })
      .lt("created_at", cutoff90);

    // Delete marketing visits older than 90 days
    const { count: visitsDeleted } = await supabase
      .from("marketing_visits")
      .delete({ count: "exact" })
      .lt("created_at", cutoff90);

    // Clean stale active sessions (older than 10 minutes)
    const cutoff10m = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: sessionsDeleted } = await supabase
      .from("active_sessions")
      .delete({ count: "exact" })
      .lt("last_seen_at", cutoff10m);

    return new Response(
      JSON.stringify({
        success: true,
        cleaned: {
          marketing_events: eventsDeleted || 0,
          marketing_visits: visitsDeleted || 0,
          stale_sessions: sessionsDeleted || 0,
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
