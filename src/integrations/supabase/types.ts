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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alunos_salas: {
        Row: {
          aluno_id: string
          created_at: string
          sala_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          sala_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          sala_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_salas_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          anexo_url: string | null
          created_at: string
          descricao: string | null
          id: string
          max_palavras: number | null
          min_palavras: number | null
          prazo: string
          publicada: boolean
          titulo: string
        }
        Insert: {
          anexo_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          max_palavras?: number | null
          min_palavras?: number | null
          prazo: string
          publicada?: boolean
          titulo: string
        }
        Update: {
          anexo_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          max_palavras?: number | null
          min_palavras?: number | null
          prazo?: string
          publicada?: boolean
          titulo?: string
        }
        Relationships: []
      }
      atividades_salas: {
        Row: {
          atividade_id: string
          sala_id: string
        }
        Insert: {
          atividade_id: string
          sala_id: string
        }
        Update: {
          atividade_id?: string
          sala_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_salas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_salas_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas: {
        Row: {
          aluno_id: string
          arquivo_url: string | null
          atividade_id: string
          comentario: string | null
          corrected_at: string | null
          created_at: string
          id: string
          marcacoes: Json
          nota: number | null
          status: Database["public"]["Enums"]["entrega_status"]
          submitted_at: string | null
          texto: string | null
          updated_at: string
        }
        Insert: {
          aluno_id: string
          arquivo_url?: string | null
          atividade_id: string
          comentario?: string | null
          corrected_at?: string | null
          created_at?: string
          id?: string
          marcacoes?: Json
          nota?: number | null
          status?: Database["public"]["Enums"]["entrega_status"]
          submitted_at?: string | null
          texto?: string | null
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          arquivo_url?: string | null
          atividade_id?: string
          comentario?: string | null
          corrected_at?: string | null
          created_at?: string
          id?: string
          marcacoes?: Json
          nota?: number | null
          status?: Database["public"]["Enums"]["entrega_status"]
          submitted_at?: string | null
          texto?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entregas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome_completo: string
          numero_chamada: number | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome_completo: string
          numero_chamada?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          numero_chamada?: number | null
        }
        Relationships: []
      }
      salas: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ranking_geral: {
        Args: never
        Returns: {
          aluno_id: string
          media: number
          nome_completo: string
          salas: string
          total_corrigidas: number
        }[]
      }
      ranking_minha_sala: {
        Args: never
        Returns: {
          aluno_id: string
          media: number
          nome_completo: string
          sala_id: string
          sala_nome: string
          total_corrigidas: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "aluno"
      entrega_status: "rascunho" | "entregue" | "fora_prazo" | "corrigida"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "aluno"],
      entrega_status: ["rascunho", "entregue", "fora_prazo", "corrigida"],
    },
  },
} as const
