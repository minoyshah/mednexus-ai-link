export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connection_note: string | null
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"] | null
          updated_at: string
        }
        Insert: {
          connection_note?: string | null
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string
        }
        Update: {
          connection_note?: string | null
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      credentials: {
        Row: {
          created_at: string
          credential_number: string | null
          credential_type: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          rejection_reason: string | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          credential_number?: string | null
          credential_type: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          rejection_reason?: string | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          credential_number?: string | null
          credential_type?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          rejection_reason?: string | null
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      daily_message_counts: {
        Row: {
          count: number | null
          id: string
          message_date: string
          user_id: string
        }
        Insert: {
          count?: number | null
          id?: string
          message_date?: string
          user_id: string
        }
        Update: {
          count?: number | null
          id?: string
          message_date?: string
          user_id?: string
        }
        Relationships: []
      }
      education: {
        Row: {
          created_at: string
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string | null
          id: string
          institution_name: string
          is_current: boolean | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution_name: string
          is_current?: boolean | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution_name?: string
          is_current?: boolean | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      experience: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          organization: string
          start_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          organization: string
          start_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          organization?: string
          start_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_request: boolean | null
          read_at: string | null
          recipient_id: string
          request_accepted: boolean | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"] | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_request?: boolean | null
          read_at?: string | null
          recipient_id: string
          request_accepted?: boolean | null
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"] | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_request?: boolean | null
          read_at?: string | null
          recipient_id?: string
          request_accepted?: boolean | null
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"] | null
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["post_category"]
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          is_pinned: boolean | null
          post_type: Database["public"]["Enums"]["post_type"] | null
          title: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          category: Database["public"]["Enums"]["post_category"]
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          is_pinned?: boolean | null
          post_type?: Database["public"]["Enums"]["post_type"] | null
          title?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["post_category"]
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          is_pinned?: boolean | null
          post_type?: Database["public"]["Enums"]["post_type"] | null
          title?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          clinical_interests: string[] | null
          created_at: string
          email: string | null
          full_name: string | null
          geographic_licenses: string[] | null
          headline: string | null
          id: string
          institution: string | null
          institution_email: string | null
          institution_verified: boolean | null
          is_premium: boolean | null
          languages: string[] | null
          medical_role: Database["public"]["Enums"]["medical_role"] | null
          onboarding_completed: boolean | null
          open_to_opportunities: boolean | null
          premium_expires_at: string | null
          primary_specialty: string | null
          research_interests: string[] | null
          subspecialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          clinical_interests?: string[] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          geographic_licenses?: string[] | null
          headline?: string | null
          id?: string
          institution?: string | null
          institution_email?: string | null
          institution_verified?: boolean | null
          is_premium?: boolean | null
          languages?: string[] | null
          medical_role?: Database["public"]["Enums"]["medical_role"] | null
          onboarding_completed?: boolean | null
          open_to_opportunities?: boolean | null
          premium_expires_at?: string | null
          primary_specialty?: string | null
          research_interests?: string[] | null
          subspecialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          clinical_interests?: string[] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          geographic_licenses?: string[] | null
          headline?: string | null
          id?: string
          institution?: string | null
          institution_email?: string | null
          institution_verified?: boolean | null
          is_premium?: boolean | null
          languages?: string[] | null
          medical_role?: Database["public"]["Enums"]["medical_role"] | null
          onboarding_completed?: boolean | null
          open_to_opportunities?: boolean | null
          premium_expires_at?: string | null
          primary_specialty?: string | null
          research_interests?: string[] | null
          subspecialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      publications: {
        Row: {
          authors: string[] | null
          created_at: string
          doi: string | null
          id: string
          journal: string | null
          publication_date: string | null
          pubmed_id: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          authors?: string[] | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          publication_date?: string | null
          pubmed_id?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          authors?: string[] | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          publication_date?: string | null
          pubmed_id?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      specialties: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialties_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          correct_answers: number | null
          created_at: string
          duration_minutes: number | null
          id: string
          questions_attempted: number | null
          topic: string
          user_id: string
        }
        Insert: {
          correct_answers?: number | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          questions_attempted?: number | null
          topic: string
          user_id: string
        }
        Update: {
          correct_answers?: number | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          questions_attempted?: number | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      study_weaknesses: {
        Row: {
          created_at: string
          id: string
          last_missed_at: string | null
          missed_count: number | null
          subtopic: string | null
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_missed_at?: string | null
          missed_count?: number | null
          subtopic?: string | null
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_missed_at?: string | null
          missed_count?: number | null
          subtopic?: string | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_send_message: { Args: { _user_id: string }; Returns: boolean }
      get_daily_message_limit: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_message_count: {
        Args: { _user_id: string }
        Returns: undefined
      }
      is_user_verified: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      connection_status: "pending" | "accepted" | "rejected" | "blocked"
      medical_role:
        | "medical_student"
        | "resident"
        | "fellow"
        | "attending"
        | "researcher"
        | "pharma_industry"
        | "admin_institution"
      message_status: "sent" | "delivered" | "read"
      post_category:
        | "clinical"
        | "research"
        | "policy"
        | "education"
        | "industry"
      post_type:
        | "text"
        | "article"
        | "case_discussion"
        | "poll"
        | "announcement"
      verification_status: "pending" | "verified" | "rejected" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      connection_status: ["pending", "accepted", "rejected", "blocked"],
      medical_role: [
        "medical_student",
        "resident",
        "fellow",
        "attending",
        "researcher",
        "pharma_industry",
        "admin_institution",
      ],
      message_status: ["sent", "delivered", "read"],
      post_category: [
        "clinical",
        "research",
        "policy",
        "education",
        "industry",
      ],
      post_type: ["text", "article", "case_discussion", "poll", "announcement"],
      verification_status: ["pending", "verified", "rejected", "expired"],
    },
  },
} as const
