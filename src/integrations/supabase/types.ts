export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_response_history: {
        Row: {
          created_at: string | null
          generated_response: string
          id: string
          lead_content: string | null
          lead_email: string
          lead_id: string
          lead_subject: string | null
          length: string
          tone: string
          updated_at: string | null
          user_id: string
          was_sent: boolean | null
          was_used: boolean | null
        }
        Insert: {
          created_at?: string | null
          generated_response: string
          id?: string
          lead_content?: string | null
          lead_email: string
          lead_id: string
          lead_subject?: string | null
          length: string
          tone: string
          updated_at?: string | null
          user_id: string
          was_sent?: boolean | null
          was_used?: boolean | null
        }
        Update: {
          created_at?: string | null
          generated_response?: string
          id?: string
          lead_content?: string | null
          lead_email?: string
          lead_id?: string
          lead_subject?: string | null
          length?: string
          tone?: string
          updated_at?: string | null
          user_id?: string
          was_sent?: boolean | null
          was_used?: boolean | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          answered: boolean | null
          created_at: string
          deleted_at: string | null
          full_content: string | null
          gmail_message_id: string
          id: string
          is_deleted: boolean | null
          notes: string | null
          received_at: string
          responded_at: string | null
          response_time_minutes: number | null
          sender_email: string
          snippet: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answered?: boolean | null
          created_at?: string
          deleted_at?: string | null
          full_content?: string | null
          gmail_message_id: string
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          received_at: string
          responded_at?: string | null
          response_time_minutes?: number | null
          sender_email: string
          snippet?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answered?: boolean | null
          created_at?: string
          deleted_at?: string | null
          full_content?: string | null
          gmail_message_id?: string
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          received_at?: string
          responded_at?: string | null
          response_time_minutes?: number | null
          sender_email?: string
          snippet?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          google_access_token: string | null
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_created_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          google_access_token?: string | null
          id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_created_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          google_access_token?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_created_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          settings: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          settings?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string | null
          id: string
          last_activity_date: string | null
          leads_classified_today: number | null
          streak_days: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          leads_classified_today?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          leads_classified_today?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          ai_responses_generated: number | null
          api_calls_made: number | null
          created_at: string | null
          emails_sent: number | null
          id: string
          leads_processed: number | null
          period_month: string
          storage_used_mb: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_responses_generated?: number | null
          api_calls_made?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_processed?: number | null
          period_month: string
          storage_used_mb?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_responses_generated?: number | null
          api_calls_made?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_processed?: number | null
          period_month?: string
          storage_used_mb?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_writing_style: {
        Row: {
          created_at: string | null
          custom_phrases: Json | null
          id: string
          preferred_length: string | null
          preferred_tone: string | null
          response_templates: Json | null
          signature: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_phrases?: Json | null
          id?: string
          preferred_length?: string | null
          preferred_tone?: string | null
          response_templates?: Json | null
          signature?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_phrases?: Json | null
          id?: string
          preferred_length?: string | null
          preferred_tone?: string | null
          response_templates?: Json | null
          signature?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_profiles_setup: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_table: boolean
          has_google_token_column: boolean
          has_service_role_access: boolean
          row_count: number
        }[]
      }
      upsert_current_month_usage: {
        Args: {
          p_user_id: string
          p_leads_delta?: number
          p_api_calls_delta?: number
          p_storage_mb_delta?: number
          p_ai_responses_delta?: number
          p_emails_delta?: number
        }
        Returns: {
          ai_responses_generated: number | null
          api_calls_made: number | null
          created_at: string | null
          emails_sent: number | null
          id: string
          leads_processed: number | null
          period_month: string
          storage_used_mb: number | null
          updated_at: string | null
          user_id: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
