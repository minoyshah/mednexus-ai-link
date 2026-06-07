import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Job = Database["public"]["Tables"]["jobs"]["Row"];

/**
 * Live job state over Supabase Realtime. The dispatch screen subscribes here to
 * follow status (requested → accepted → en_route → arrived → completed/…) and
 * server-set pricing as the Edge Functions update the row. Reads are RLS-scoped
 * to the job's customer and assigned pro.
 */
export function useJobStatus(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }
    let active = true;
    let channel: RealtimeChannel | null = null;
    setLoading(true);

    (async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
      if (!active) return;
      setJob((data as Job | null) ?? null);
      setLoading(false);

      channel = supabase
        .channel(`jobs:${jobId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
          (payload) => setJob(payload.new as Job),
        )
        .subscribe();
    })();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { job, loading, status: job?.status ?? null };
}
