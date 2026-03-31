import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * The Reaper — Fussy's match expiry worker.
 *
 * Designed to run hourly via pg_cron:
 *   SELECT cron.schedule('reaper', '0 * * * *', $$
 *     SELECT net.http_post(
 *       url := 'https://<ref>.supabase.co/functions/v1/reaper',
 *       headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
 *     ) AS request_id;
 *   $$);
 *
 * Or invoke directly via Supabase dashboard / CLI for testing.
 */
Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("matches")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", now)
    .select("id, user_1, user_2, expires_at");

  if (error) {
    console.error("[Reaper] Error:", error.message);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const count = data?.length ?? 0;
  console.log(`[Reaper] Expired ${count} match(es) at ${now}`);

  return new Response(
    JSON.stringify({ ok: true, expired: count, timestamp: now }),
    { headers: { "Content-Type": "application/json" } },
  );
});
