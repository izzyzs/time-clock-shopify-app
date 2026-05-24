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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          active: boolean
          code: string
          first_name: string
          id: number
          last_name: string
          pin_hash: string
          shop: string
        }
        Insert: {
          active?: boolean
          code: string
          first_name: string
          id?: never
          last_name: string
          pin_hash: string
          shop: string
        }
        Update: {
          active?: boolean
          code?: string
          first_name?: string
          id?: never
          last_name?: string
          pin_hash?: string
          shop?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: number
          location: string
          shop: string
        }
        Insert: {
          id?: never
          location: string
          shop: string
        }
        Update: {
          id?: never
          location?: string
          shop?: string
        }
        Relationships: []
      }
      shopify_sessions: {
        Row: {
          accessToken: string | null
          expires: number | null
          id: string
          isOnline: boolean
          onlineAccessInfo: string | null
          refreshToken: string | null
          refreshTokenExpires: number | null
          scope: string | null
          shop: string
          state: string
        }
        Insert: {
          accessToken?: string | null
          expires?: number | null
          id: string
          isOnline: boolean
          onlineAccessInfo?: string | null
          refreshToken?: string | null
          refreshTokenExpires?: number | null
          scope?: string | null
          shop: string
          state: string
        }
        Update: {
          accessToken?: string | null
          expires?: number | null
          id?: string
          isOnline?: boolean
          onlineAccessInfo?: string | null
          refreshToken?: string | null
          refreshTokenExpires?: number | null
          scope?: string | null
          shop?: string
          state?: string
        }
        Relationships: []
      }
      shopify_sessions_migrations: {
        Row: {
          migration_name: string
        }
        Insert: {
          migration_name: string
        }
        Update: {
          migration_name?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          employee_id: number
          id: number
          location: string
          notes: string | null
          shop: string
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          employee_id: number
          id?: never
          location: string
          notes?: string | null
          shop: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          employee_id?: number
          id?: never
          location?: string
          notes?: string | null
          shop?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_time_log_report: {
        Args: {
          p_employee_id?: number
          p_end_date?: string
          p_shop: string
          p_start_date?: string
        }
        Returns: {
          clock_in: string
          clock_out: string
          employee_id: number
          first_name: string
          id: number
          last_name: string
          location: string
          notes: string
        }[]
      }
      create_time_report: {
        Args: {
          p_employee_id?: number
          p_end_date?: string
          p_shop: string
          p_start_date?: string
        }
        Returns: {
          avg_shift: number
          employee_first_name: string
          employee_id: number
          employee_last_name: string
          hours: number
          shifts: number
        }[]
      }
      get_active_time_entry_id: {
        Args: { p_employee_id: number; p_shop: string }
        Returns: number
      }
      get_current_clock_status: {
        Args: { p_shop: string }
        Returns: {
          active: boolean
          code: string
          first_name: string
          id: number
          is_clocked_in: boolean
          last_name: string
          pin_hash: string
          shop: string
        }[]
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
    Enums: {},
  },
} as const
