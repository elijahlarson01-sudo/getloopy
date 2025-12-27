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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      challenge_attempts: {
        Row: {
          challenge_id: string
          completed_at: string
          created_at: string
          id: string
          questions_answered: number
          score: number
          seconds_used: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          created_at?: string
          id?: string
          questions_answered?: number
          score?: number
          seconds_used?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          created_at?: string
          id?: string
          questions_answered?: number
          score?: number
          seconds_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenger_user_id: string
          cohort_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_draw: boolean
          opponent_user_id: string
          previous_challenge_id: string | null
          stake_points: number
          status: Database["public"]["Enums"]["challenge_status"]
          subject_id: string
          updated_at: string
          winner_user_id: string | null
        }
        Insert: {
          challenger_user_id: string
          cohort_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_draw?: boolean
          opponent_user_id: string
          previous_challenge_id?: string | null
          stake_points: number
          status?: Database["public"]["Enums"]["challenge_status"]
          subject_id: string
          updated_at?: string
          winner_user_id?: string | null
        }
        Update: {
          challenger_user_id?: string
          cohort_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_draw?: boolean
          opponent_user_id?: string
          previous_challenge_id?: string | null
          stake_points?: number
          status?: Database["public"]["Enums"]["challenge_status"]
          subject_id?: string
          updated_at?: string
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_previous_challenge_id_fkey"
            columns: ["previous_challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_subjects: {
        Row: {
          cohort_id: string
          created_at: string | null
          id: string
          subject_id: string
        }
        Insert: {
          cohort_id: string
          created_at?: string | null
          id?: string
          subject_id: string
        }
        Update: {
          cohort_id?: string
          created_at?: string | null
          id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_subjects_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string | null
          degree_name: string
          id: string
          university_id: string | null
        }
        Insert: {
          created_at?: string | null
          degree_name: string
          id?: string
          university_id?: string | null
        }
        Update: {
          created_at?: string | null
          degree_name?: string
          id?: string
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string
          id: string
          order_index: number
          question_count: number
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level: string
          id?: string
          order_index: number
          question_count?: number
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string
          id?: string
          order_index?: number
          question_count?: number
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          module_id: string
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          module_id: string
          options?: Json | null
          order_index?: number
          question_text: string
          question_type: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          module_id?: string
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      university_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          university_id: string
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          university_id: string
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_domains_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_progress: {
        Row: {
          accuracy_percentage: number
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          module_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_percentage?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          cohort_id: string | null
          created_at: string | null
          id: string
          is_studying_degree: boolean | null
          motivation: string | null
          onboarding_completed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string | null
          id?: string
          is_studying_degree?: boolean | null
          motivation?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cohort_id?: string | null
          created_at?: string | null
          id?: string
          is_studying_degree?: boolean | null
          motivation?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_practice_date: string | null
          mastery_points: number
          updated_at: string
          user_id: string
          weekly_mastery_points: number
          weekly_points_reset_date: string | null
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          mastery_points?: number
          updated_at?: string
          user_id: string
          weekly_mastery_points?: number
          weekly_points_reset_date?: string | null
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          mastery_points?: number
          updated_at?: string
          user_id?: string
          weekly_mastery_points?: number
          weekly_points_reset_date?: string | null
        }
        Relationships: []
      }
      user_question_attempts: {
        Row: {
          attempted_at: string
          id: string
          is_correct: boolean
          question_id: string
          user_answer: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          user_answer: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          user_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subject_interests: {
        Row: {
          created_at: string | null
          id: string
          interest_category: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_category: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_category?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subject_progress: {
        Row: {
          accuracy_percentage: number
          created_at: string
          id: string
          lessons_completed: number
          mastery_level: number
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number
          created_at?: string
          id?: string
          lessons_completed?: number
          mastery_level?: number
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_percentage?: number
          created_at?: string
          id?: string
          lessons_completed?: number
          mastery_level?: number
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subject_progress_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_cohort_id: { Args: { _user_id: string }; Returns: string }
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
      challenge_status: "pending" | "completed"
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
      challenge_status: ["pending", "completed"],
    },
  },
} as const
