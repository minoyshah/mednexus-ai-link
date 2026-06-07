// POST cron-auto-confirm — scheduled task (rule 6). Auto-confirms jobs whose
// 24h window elapsed, then captures funds for the ones that just completed.
// Authenticated by a shared secret (verify_jwt=false), so a scheduler can call
// it without a user session.
import { handle, json, HttpError } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { loadJob } from "../_shared/jobs.ts";
import { getStripe, captureJob } from "../_shared/stripe.ts";

Deno.serve(handle(async (req) => {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== Deno.env.get("CRON_SECRET")) throw new HttpError(401, "Unauthorized");

  const service = serviceClient();
  const { data: autoConfirmed, error } = await service.rpc("auto_confirm_due");
  if (error) throw error;

  // Capture funds for completed jobs that still have a held authorization.
  let captured = 0;
  try {
    const stripe = getStripe();
    const { data: pending } = await service
      .from("payments").select("job_id").eq("kind", "authorization").eq("status", "requires_capture");
    for (const row of pending ?? []) {
      const job = await loadJob(service, row.job_id as string);
      if (job.status === "completed") {
        await captureJob(service, stripe, job);
        captured++;
      }
    }
  } catch (e) {
    console.error("auto-confirm capture skipped:", e instanceof Error ? e.message : e);
  }

  return json({ auto_confirmed: autoConfirmed ?? 0, captured });
}));
