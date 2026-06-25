export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SavingsFrequency = "daily" | "weekly" | "biweekly" | "monthly";
export type WantStatus = "active" | "decided" | "expired";
export type DecisionOutcome = "bought" | "extended" | "walked_away";
export type ReminderType = "savings" | "enthusiasm";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          default_waiting_weeks: number;
          savings_frequency: SavingsFrequency;
          default_savings_reminder_freq: SavingsFrequency;
          default_enthusiasm_min_days: number;
          default_enthusiasm_max_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          default_waiting_weeks?: number;
          savings_frequency?: SavingsFrequency;
          default_savings_reminder_freq?: SavingsFrequency;
          default_enthusiasm_min_days?: number;
          default_enthusiasm_max_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      wants: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          price_cents: number;
          currency: string;
          image_url: string | null;
          link_url: string | null;
          reason: string | null;
          category: string | null;
          waiting_period_days: number;
          started_at: string;
          ends_at: string;
          savings_frequency: SavingsFrequency;
          contribution_amount_cents: number;
          status: WantStatus;
          savings_reminder_frequency: SavingsFrequency;
          enthusiasm_reminder_min_days: number;
          enthusiasm_reminder_max_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          price_cents: number;
          currency?: string;
          image_url?: string | null;
          link_url?: string | null;
          reason?: string | null;
          category?: string | null;
          waiting_period_days: number;
          started_at?: string;
          ends_at: string;
          savings_frequency: SavingsFrequency;
          contribution_amount_cents: number;
          status?: WantStatus;
          savings_reminder_frequency?: SavingsFrequency;
          enthusiasm_reminder_min_days?: number;
          enthusiasm_reminder_max_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wants"]["Insert"]>;
        Relationships: [];
      };
      savings_entries: {
        Row: {
          id: string;
          want_id: string;
          user_id: string;
          amount_cents: number;
          note: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          want_id: string;
          user_id: string;
          amount_cents: number;
          note?: string | null;
          logged_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["savings_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "savings_entries_want_id_fkey";
            columns: ["want_id"];
            isOneToOne: false;
            referencedRelation: "wants";
            referencedColumns: ["id"];
          }
        ];
      };
      reminders: {
        Row: {
          id: string;
          want_id: string;
          user_id: string;
          type: ReminderType;
          prompt: string | null;
          response: string | null;
          intensity: number | null;
          scheduled_for: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          want_id: string;
          user_id: string;
          type: ReminderType;
          prompt?: string | null;
          response?: string | null;
          intensity?: number | null;
          scheduled_for: string;
          responded_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reminders"]["Insert"]>;
        Relationships: [];
      };
      decisions: {
        Row: {
          id: string;
          want_id: string;
          user_id: string;
          outcome: DecisionOutcome;
          reflection: string | null;
          decided_at: string;
          extended_until: string | null;
        };
        Insert: {
          id?: string;
          want_id: string;
          user_id: string;
          outcome: DecisionOutcome;
          reflection?: string | null;
          decided_at?: string;
          extended_until?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["decisions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "decisions_want_id_fkey";
            columns: ["want_id"];
            isOneToOne: true;
            referencedRelation: "wants";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
