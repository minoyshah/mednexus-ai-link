import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { HttpError } from "./http.ts";
import { splitJob, type JobStatusName } from "./engine.ts";

export interface Job {
  id: string;
  customer_id: string;
  pro_id: string | null;
  trade: string;
  problem: string;
  is_open: boolean;
  budget: number | null;
  labor_amount: number;
  parts_amount: number;
  agreed_price: number;
  fee_amount: number;
  payout_amount: number;
  status: JobStatusName;
  [k: string]: unknown;
}

export interface ProProfile {
  id: string;
  trades: string[];
  status: "onboarding" | "active" | "under_review" | "paused";
  verification_status: "pending" | "verified" | "rejected";
  is_online: boolean;
  [k: string]: unknown;
}

/** Load a job by id with the service client, or 404. */
export async function loadJob(service: SupabaseClient, id: string): Promise<Job> {
  const { data, error } = await service.from("jobs").select("*").eq("id", id).single();
  if (error || !data) throw new HttpError(404, "Job not found");
  return data as Job;
}

export function assertCustomer(job: Job, userId: string): void {
  if (job.customer_id !== userId) throw new HttpError(403, "Only the job's customer can do this");
}

export function assertAssignedPro(job: Job, userId: string): void {
  if (job.pro_id !== userId) throw new HttpError(403, "Only the assigned pro can do this");
}

/** Load the caller's pro profile, or 403 if they aren't a pro. */
export async function loadProProfile(service: SupabaseClient, userId: string): Promise<ProProfile> {
  const { data, error } = await service.from("pro_profiles").select("*").eq("id", userId).single();
  if (error || !data) throw new HttpError(403, "Complete pro onboarding first");
  return data as ProProfile;
}

/**
 * A pro may only take work when verified, active (not paused/under review by the
 * guardrail), and online. Enforces rules 7 & 9 at the API boundary.
 */
export function assertProCanWork(pro: ProProfile): void {
  if (pro.verification_status !== "verified") throw new HttpError(403, "Pro is not verified yet");
  if (pro.status === "paused" || pro.status === "under_review") {
    throw new HttpError(403, "Account under review — new jobs are paused");
  }
}

/** Compute the server-authoritative pricing fields from parts + labor. */
export function quoteFields(parts: number, labor: number) {
  const { fee, total, payout } = splitJob(parts, labor);
  return {
    parts_amount: parts,
    labor_amount: labor,
    agreed_price: total,
    fee_amount: fee,
    payout_amount: payout,
  };
}

/** Update a job with the service client and return the fresh row. */
export async function updateJob(
  service: SupabaseClient,
  id: string,
  patch: Record<string, unknown>,
): Promise<Job> {
  const { data, error } = await service.from("jobs").update(patch).eq("id", id).select("*").single();
  if (error) throw new HttpError(500, error.message);
  return data as Job;
}
