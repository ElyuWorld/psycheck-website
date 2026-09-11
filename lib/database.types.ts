export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "student" | "counselor" | "admin";
          student_id: string | null;
          year_level: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "student" | "counselor" | "admin";
          student_id?: string | null;
          year_level?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "student" | "counselor" | "admin";
          student_id?: string | null;
          year_level?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      availability: {
        Row: {
          id: string;
          counselor_id: string | null;
          date: string;
          start_time: string;
          end_time: string;
          appointment_type: string;
          mode: "Online" | "In-person";
          created_at: string;
        };
        Insert: {
          id?: string;
          counselor_id?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          appointment_type: string;
          mode: "Online" | "In-person";
          created_at?: string;
        };
        Update: {
          id?: string;
          counselor_id?: string | null;
          date?: string;
          start_time?: string;
          end_time?: string;
          appointment_type?: string;
          mode?: "Online" | "In-person";
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          student_user_id: string | null;
          student_name: string;
          student_id: string;
          email: string;
          year_level: string | null;
          appointment_type: string;
          mode: "Online" | "In-person";
          preferred_date: string;
          preferred_time: string;
          reason: string | null;
          message: string | null;
          status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
          meeting_link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_user_id?: string | null;
          student_name: string;
          student_id: string;
          email: string;
          year_level?: string | null;
          appointment_type: string;
          mode?: "Online" | "In-person";
          preferred_date: string;
          preferred_time: string;
          reason?: string | null;
          message?: string | null;
          status?: "Pending" | "Confirmed" | "Completed" | "Cancelled";
          meeting_link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_user_id?: string | null;
          student_name?: string;
          student_id?: string;
          email?: string;
          year_level?: string | null;
          appointment_type?: string;
          mode?: "Online" | "In-person";
          preferred_date?: string;
          preferred_time?: string;
          reason?: string | null;
          message?: string | null;
          status?: "Pending" | "Confirmed" | "Completed" | "Cancelled";
          meeting_link?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
