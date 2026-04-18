// Types auto-générés depuis Supabase — ne pas éditer à la main.
// Régénérer avec : pnpm supabase gen types typescript --local > types/database.ts
// Ce stub sera remplacé après `supabase db reset`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          owner_id: string
          name: string
          logo_url: string | null
          type: 'Association' | 'Personal'
          default_llm_model: string
          system_prompt_global: string | null
          social_networks: Json
          platform_specific_prompts: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          logo_url?: string | null
          type?: 'Association' | 'Personal'
          default_llm_model?: string
          system_prompt_global?: string | null
          social_networks?: Json
          platform_specific_prompts?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          logo_url?: string | null
          type?: 'Association' | 'Personal'
          default_llm_model?: string
          system_prompt_global?: string | null
          social_networks?: Json
          platform_specific_prompts?: Json
          updated_at?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'Owner' | 'Editor' | 'Viewer'
          joined_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'Owner' | 'Editor' | 'Viewer'
          joined_at?: string
        }
        Update: {
          role?: 'Owner' | 'Editor' | 'Viewer'
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          fields: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          fields?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          fields?: Json
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          workspace_id: string
          template_id: string
          name: string
          status: 'Draft' | 'InProgress' | 'Ready' | 'Sent'
          raw_data: Json
          ai_clarification_questions: Json
          editorial_skeleton: Json | null
          skeleton_approved_by_user: boolean
          generated_content: Json
          final_edits: Json
          sent_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          template_id: string
          name: string
          status?: 'Draft' | 'InProgress' | 'Ready' | 'Sent'
          raw_data?: Json
          ai_clarification_questions?: Json
          editorial_skeleton?: Json | null
          skeleton_approved_by_user?: boolean
          generated_content?: Json
          final_edits?: Json
          sent_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          name?: string
          status?: 'Draft' | 'InProgress' | 'Ready' | 'Sent'
          raw_data?: Json
          ai_clarification_questions?: Json
          editorial_skeleton?: Json | null
          skeleton_approved_by_user?: boolean
          generated_content?: Json
          final_edits?: Json
          sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      editorial_charters: {
        Row: {
          id: string
          workspace_id: string
          tone_guidelines: string | null
          vocabulary_rules: Json
          content_rules: Json
          brand_guidelines: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          tone_guidelines?: string | null
          vocabulary_rules?: Json
          content_rules?: Json
          brand_guidelines?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          tone_guidelines?: string | null
          vocabulary_rules?: Json
          content_rules?: Json
          brand_guidelines?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_logs: {
        Row: {
          id: string
          workspace_id: string
          campaign_id: string | null
          model_used: string
          step: 'clarification' | 'skeleton' | 'generation' | 'validation'
          prompt: string
          response: string
          tokens_used: number | null
          input_tokens: number | null
          output_tokens: number | null
          input_cost_usd: number | null
          output_cost_usd: number | null
          charter_validation_passed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          campaign_id?: string | null
          model_used: string
          step: 'clarification' | 'skeleton' | 'generation' | 'validation'
          prompt: string
          response: string
          tokens_used?: number | null
          input_tokens?: number | null
          output_tokens?: number | null
          input_cost_usd?: number | null
          output_cost_usd?: number | null
          charter_validation_passed?: boolean | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      ai_pricing: {
        Row: {
          model_id: string
          provider: 'anthropic' | 'openai' | 'ollama'
          input_cost_per_1m: number
          output_cost_per_1m: number
          effective_from: string
          created_at: string
          updated_at: string
        }
        Insert: {
          model_id: string
          provider: 'anthropic' | 'openai' | 'ollama'
          input_cost_per_1m: number
          output_cost_per_1m: number
          effective_from?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          provider?: 'anthropic' | 'openai' | 'ollama'
          input_cost_per_1m?: number
          output_cost_per_1m?: number
          effective_from?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_rate_limits: {
        Row: {
          id: string
          workspace_id: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      publishing_events: {
        Row: {
          id: string
          workspace_id: string
          campaign_id: string
          platform: string
          webhook_url: string | null
          webhook_payload: Json | null
          response_status: number | null
          response_body: string | null
          scheduled_for: string | null
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          campaign_id: string
          platform: string
          webhook_url?: string | null
          webhook_payload?: Json | null
          response_status?: number | null
          response_body?: string | null
          scheduled_for?: string | null
          published_at?: string | null
          created_at?: string
        }
        Update: {
          response_status?: number | null
          response_body?: string | null
          scheduled_for?: string | null
          published_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_workspace_member: {
        Args: { wid: string; min_role?: string }
        Returns: boolean
      }
      check_and_record_webhook_rate_limit: {
        Args: {
          p_workspace_id: string
          p_window_seconds?: number
          p_max_requests?: number
        }
        Returns: {
          allowed: boolean
          current_count: number
          retry_after_seconds: number
        }[]
      }
    }
    Enums: Record<string, never>
  }
}

// Types dérivés pour usage dans l'application
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type Template = Database['public']['Tables']['templates']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type EditorialCharter = Database['public']['Tables']['editorial_charters']['Row']
export type AILog = Database['public']['Tables']['ai_logs']['Row']
export type PublishingEvent = Database['public']['Tables']['publishing_events']['Row']
export type WebhookRateLimit = Database['public']['Tables']['webhook_rate_limits']['Row']
