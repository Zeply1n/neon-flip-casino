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
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      coinflip_games: {
        Row: {
          bet_amount: number
          chosen_side: string
          client_seed: string
          created_at: string
          house_edge: number
          id: string
          nonce: number
          payout: number
          result: string
          server_seed_hash: string
          user_id: string
          won: boolean
        }
        Insert: {
          bet_amount: number
          chosen_side: string
          client_seed: string
          created_at?: string
          house_edge: number
          id?: string
          nonce: number
          payout: number
          result: string
          server_seed_hash: string
          user_id: string
          won: boolean
        }
        Update: {
          bet_amount?: number
          chosen_side?: string
          client_seed?: string
          created_at?: string
          house_edge?: number
          id?: string
          nonce?: number
          payout?: number
          result?: string
          server_seed_hash?: string
          user_id?: string
          won?: boolean
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          admin_note: string | null
          amount: number | null
          created_at: string
          id: string
          method: string
          reference: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          admin_note?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          method: string
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          method?: string
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: []
      }
      house_edge_settings: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          edge_percent: number
          effective_from: string
          game_key: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          edge_percent?: number
          effective_from?: string
          game_key: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          edge_percent?: number
          effective_from?: string
          game_key?: string
          id?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          ref_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          ref_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          ref_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      mines_games: {
        Row: {
          bet_amount: number
          client_seed: string
          created_at: string
          current_multiplier: number
          ended_at: string | null
          house_edge: number
          id: string
          mine_positions: number[]
          mines_count: number
          nonce: number
          payout: number | null
          revealed_positions: number[]
          server_seed_hash: string
          status: string
          user_id: string
        }
        Insert: {
          bet_amount: number
          client_seed: string
          created_at?: string
          current_multiplier?: number
          ended_at?: string | null
          house_edge: number
          id?: string
          mine_positions: number[]
          mines_count: number
          nonce: number
          payout?: number | null
          revealed_positions?: number[]
          server_seed_hash: string
          status?: string
          user_id: string
        }
        Update: {
          bet_amount?: number
          client_seed?: string
          created_at?: string
          current_multiplier?: number
          ended_at?: string | null
          house_edge?: number
          id?: string
          mine_positions?: number[]
          mines_count?: number
          nonce?: number
          payout?: number | null
          revealed_positions?: number[]
          server_seed_hash?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          account_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          account_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      provably_fair_seeds: {
        Row: {
          client_seed: string
          created_at: string
          id: string
          nonce: number
          server_seed: string
          server_seed_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_seed?: string
          created_at?: string
          id?: string
          nonce?: number
          server_seed: string
          server_seed_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_seed?: string
          created_at?: string
          id?: string
          nonce?: number
          server_seed?: string
          server_seed_hash?: string
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vouchers: {
        Row: {
          amount: number
          code: string
          created_at: string
          id: string
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          destination: string
          id: string
          method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          destination: string
          id?: string
          method: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          destination?: string
          id?: string
          method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_house_edge: { Args: { _game_key: string }; Returns: number }
      get_user_balance: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
