// Aquilla database types. Hand-maintained to mirror supabase/migrations.
// Regenerate with `supabase gen types typescript` once the CLI is wired up.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AquillaTrade =
  | "roadside" | "plumb" | "elec" | "hvac" | "lock" | "roof" | "pest"
  | "appliance" | "garage" | "handy" | "paint" | "land" | "move" | "clean" | "other";

export type JobStatus =
  | "requested" | "accepted" | "en_route" | "arrived" | "awaiting_part"
  | "completed" | "visit_fee" | "disputed" | "cancelled";

export type VerificationStatus = "pending" | "verified" | "rejected";
export type ProStatus = "onboarding" | "active" | "under_review" | "paused";
export type PaymentKind = "authorization" | "deposit" | "balance" | "visit_fee" | "refund";
export type PaymentStatus = "requires_capture" | "captured" | "refunded" | "canceled" | "failed";
export type PayoutStatus = "pending" | "in_transit" | "paid" | "failed" | "reversed";
export type DisputeStatus = "open" | "resolved_release" | "resolved_refund" | "resolved_split";
export type ClaimStatus = "claimed" | "selected" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          rating: number | null;
          is_pro: boolean;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          rating?: number | null;
          is_pro?: boolean;
          stripe_customer_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      pro_profiles: {
        Row: {
          id: string;
          trades: AquillaTrade[];
          area: string | null;
          lat: number | null;
          lng: number | null;
          radius_miles: number;
          experience: string | null;
          license_number: string | null;
          license_state: string | null;
          insured: boolean;
          background_check_consent: boolean;
          is_online: boolean;
          verification_status: VerificationStatus;
          status: ProStatus;
          completed_count: number;
          incomplete_count: number;
          completion_rate: number | null;
          stripe_account_id: string | null;
          payouts_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          trades?: AquillaTrade[];
          area?: string | null;
          lat?: number | null;
          lng?: number | null;
          radius_miles?: number;
          experience?: string | null;
          license_number?: string | null;
          license_state?: string | null;
          insured?: boolean;
          background_check_consent?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["pro_profiles"]["Insert"]>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          customer_id: string;
          pro_id: string | null;
          trade: AquillaTrade;
          problem: string;
          is_open: boolean;
          budget: number | null;
          labor_amount: number;
          parts_amount: number;
          agreed_price: number;
          visit_fee_amount: number | null;
          deposit_amount: number | null;
          fee_amount: number;
          payout_amount: number;
          status: JobStatus;
          address: string | null;
          lat: number | null;
          lng: number | null;
          return_date: string | null;
          part_note: string | null;
          customer_confirmed: boolean | null;
          pro_confirmed: boolean | null;
          customer_confirmed_at: string | null;
          pro_confirmed_at: string | null;
          confirm_deadline: string | null;
          accepted_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          customer_id: string;
          trade: AquillaTrade;
          problem: string;
          is_open?: boolean;
          budget?: number | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
        Relationships: [];
      };
      job_messages: {
        Row: {
          id: string;
          job_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: { job_id: string; sender_id: string; body: string };
        Update: Partial<Database["public"]["Tables"]["job_messages"]["Insert"]>;
        Relationships: [];
      };
      job_claims: {
        Row: {
          id: string;
          job_id: string;
          pro_id: string;
          status: ClaimStatus;
          created_at: string;
        };
        Insert: { job_id: string; pro_id: string; status?: ClaimStatus };
        Update: Partial<Database["public"]["Tables"]["job_claims"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          job_id: string;
          customer_id: string;
          pro_id: string;
          rating: number;
          comment: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: {
          job_id: string;
          customer_id: string;
          pro_id: string;
          rating: number;
          comment?: string | null;
          tags?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          job_id: string;
          kind: PaymentKind;
          amount: number;
          stripe_payment_intent_id: string | null;
          status: PaymentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          job_id: string;
          kind: PaymentKind;
          amount: number;
          stripe_payment_intent_id?: string | null;
          status?: PaymentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string;
          job_id: string;
          pro_id: string;
          amount: number;
          fee: number;
          status: PayoutStatus;
          stripe_transfer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          job_id: string;
          pro_id: string;
          amount: number;
          fee: number;
          status?: PayoutStatus;
          stripe_transfer_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payouts"]["Insert"]>;
        Relationships: [];
      };
      disputes: {
        Row: {
          id: string;
          job_id: string;
          opened_by: string | null;
          reason: string | null;
          status: DisputeStatus;
          resolution_note: string | null;
          resolved_by: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          job_id: string;
          opened_by?: string | null;
          reason?: string | null;
          status?: DisputeStatus;
        };
        Update: Partial<Database["public"]["Tables"]["disputes"]["Insert"]>;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          stripe_event_id: string;
          type: string | null;
          payload: Json | null;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          stripe_event_id: string;
          type?: string | null;
          payload?: Json | null;
          processed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      aquilla_split_job: {
        Args: { p_parts: number; p_labor: number };
        Returns: { fee: number; total: number; payout: number }[];
      };
      haversine_miles: {
        Args: { lat1: number; lng1: number; lat2: number; lng2: number };
        Returns: number;
      };
      set_pro_online: { Args: { p_online: boolean }; Returns: boolean };
      submit_confirmation: { Args: { p_job: string; p_completed: boolean }; Returns: JobStatus };
      auto_confirm_due: { Args: Record<string, never>; Returns: number };
      nearby_jobs: { Args: Record<string, never>; Returns: Database["public"]["Tables"]["jobs"]["Row"][] };
    };
    Enums: {
      aquilla_trade: AquillaTrade;
      job_status: JobStatus;
      verification_status: VerificationStatus;
      pro_status: ProStatus;
      payment_kind: PaymentKind;
      payment_status: PaymentStatus;
      payout_status: PayoutStatus;
      dispute_status: DisputeStatus;
      claim_status: ClaimStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
