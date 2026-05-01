export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type NoRelationships = []

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          parent_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string
          created_at?: string
        }
        Relationships: NoRelationships
      }
      kids: {
        Row: {
          id: string
          family_id: string
          supabase_user_id: string
          name: string
          birthday: string
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          supabase_user_id: string
          name: string
          birthday: string
          points?: number
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          supabase_user_id?: string
          name?: string
          birthday?: string
          points?: number
          created_at?: string
        }
        Relationships: NoRelationships
      }
      chores: {
        Row: {
          id: string
          family_id: string
          name: string
          penalty: number
          is_important: boolean
          icon: string
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          penalty?: number
          is_important?: boolean
          icon: string
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          penalty?: number
          is_important?: boolean
          icon?: string
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: NoRelationships
      }
      chore_assignments: {
        Row: {
          id: string
          chore_id: string
          kid_id: string
          created_at: string
        }
        Insert: {
          id?: string
          chore_id: string
          kid_id: string
          created_at?: string
        }
        Update: {
          id?: string
          chore_id?: string
          kid_id?: string
          created_at?: string
        }
        Relationships: NoRelationships
      }
      effort_levels: {
        Row: {
          id: string
          family_id: string
          name: string
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          points?: number
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          points?: number
          created_at?: string
        }
        Relationships: NoRelationships
      }
      rewards: {
        Row: {
          id: string
          family_id: string
          name: string
          points_cost: number
          icon: string
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          points_cost: number
          icon: string
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          points_cost?: number
          icon?: string
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: NoRelationships
      }
      day_records: {
        Row: {
          id: string
          kid_id: string
          date: string
          is_rest_day: boolean
          effort_level_id: string | null
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          kid_id: string
          date: string
          is_rest_day?: boolean
          effort_level_id?: string | null
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          kid_id?: string
          date?: string
          is_rest_day?: boolean
          effort_level_id?: string | null
          ended_at?: string | null
          created_at?: string
        }
        Relationships: NoRelationships
      }
      chore_completions: {
        Row: {
          id: string
          day_record_id: string
          chore_assignment_id: string
          chore_name_snapshot: string
          penalty_snapshot: number
          is_important_snapshot: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          day_record_id: string
          chore_assignment_id: string
          chore_name_snapshot: string
          penalty_snapshot: number
          is_important_snapshot: boolean
          completed_at?: string | null
        }
        Update: {
          id?: string
          day_record_id?: string
          chore_assignment_id?: string
          chore_name_snapshot?: string
          penalty_snapshot?: number
          is_important_snapshot?: boolean
          completed_at?: string | null
        }
        Relationships: NoRelationships
      }
      reward_redemptions: {
        Row: {
          id: string
          kid_id: string
          reward_id: string
          reward_name_snapshot: string
          points_cost_snapshot: number
          redeemed_at: string
        }
        Insert: {
          id?: string
          kid_id: string
          reward_id: string
          reward_name_snapshot: string
          points_cost_snapshot: number
          redeemed_at?: string
        }
        Update: {
          id?: string
          kid_id?: string
          reward_id?: string
          reward_name_snapshot?: string
          points_cost_snapshot?: number
          redeemed_at?: string
        }
        Relationships: NoRelationships
      }
      activity_log: {
        Row: {
          id: string
          family_id: string
          kid_id: string | null
          actor_type: 'parent' | 'kid'
          action_type:
            | 'chore_completed'
            | 'chore_unchecked'
            | 'rest_day_purchased'
            | 'reward_redeemed'
            | 'day_ended'
            | 'penalty_applied'
            | 'effort_awarded'
            | 'chore_assigned'
            | 'chore_unassigned'
            | 'manual_adjustment'
          metadata: Json
          points_delta: number | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          kid_id?: string | null
          actor_type: 'parent' | 'kid'
          action_type:
            | 'chore_completed'
            | 'chore_unchecked'
            | 'rest_day_purchased'
            | 'reward_redeemed'
            | 'day_ended'
            | 'penalty_applied'
            | 'effort_awarded'
            | 'chore_assigned'
            | 'chore_unassigned'
            | 'manual_adjustment'
          metadata?: Json
          points_delta?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          kid_id?: string | null
          actor_type?: 'parent' | 'kid'
          action_type?:
            | 'chore_completed'
            | 'chore_unchecked'
            | 'rest_day_purchased'
            | 'reward_redeemed'
            | 'day_ended'
            | 'penalty_applied'
            | 'effort_awarded'
            | 'chore_assigned'
            | 'chore_unassigned'
            | 'manual_adjustment'
          metadata?: Json
          points_delta?: number | null
          created_at?: string
        }
        Relationships: NoRelationships
      }
    }
    Views: Record<string, never>
    // apply_points_delta was dropped in migration 0006_event_sourcing.sql;
    // kids.points is now maintained by the after_activity_log_insert trigger.
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
