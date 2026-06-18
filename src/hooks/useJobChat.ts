import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { appendUniqueById, sortByCreatedAt } from "@/lib/aquilla/realtime";

export type JobMessage = Database["public"]["Tables"]["job_messages"]["Row"];

/**
 * Live chat for a job thread over Supabase Realtime. Loads history, then
 * streams new messages via the `job_messages` publication. RLS limits both the
 * query and the stream to the two participants, and the INSERT policy stamps
 * `sender_id = auth.uid()`, so the client only ever sends its own messages.
 */
export function useJobChat(jobId: string | null) {
  const [messages, setMessages] = useState<JobMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let active = true;
    let channel: RealtimeChannel | null = null;
    setLoading(true);

    (async () => {
      const { data, error: qErr } = await supabase
        .from("job_messages")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      if (!active) return;
      if (qErr) setError(qErr.message);
      else setMessages(sortByCreatedAt(data ?? []));
      setLoading(false);

      channel = supabase
        .channel(`job_messages:${jobId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "job_messages", filter: `job_id=eq.${jobId}` },
          (payload) => setMessages((prev) => appendUniqueById(prev, payload.new as JobMessage)),
        )
        .subscribe();
    })();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [jobId]);

  const send = useCallback(
    async (body: string) => {
      const text = body.trim();
      if (!jobId || !text) return;
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      // The realtime INSERT echo appends it; RLS verifies participant + sender.
      const { error: insErr } = await supabase
        .from("job_messages")
        .insert({ job_id: jobId, sender_id: uid, body: text });
      if (insErr) throw insErr;
    },
    [jobId],
  );

  return { messages, loading, error, send };
}
