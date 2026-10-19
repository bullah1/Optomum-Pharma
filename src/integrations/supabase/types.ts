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
      active_sessions: {
        Row: {
          area: string | null
          browser: string | null
          created_at: string
          device_type: string | null
          district: string | null
          division: string | null
          id: string
          last_seen_at: string
          os: string | null
          page_url: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          area?: string | null
          browser?: string | null
          created_at?: string
          device_type?: string | null
          district?: string | null
          division?: string | null
          id?: string
          last_seen_at?: string
          os?: string | null
          page_url?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          area?: string | null
          browser?: string | null
          created_at?: string
          device_type?: string | null
          district?: string | null
          division?: string | null
          id?: string
          last_seen_at?: string
          os?: string | null
          page_url?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_spend: {
        Row: {
          amount: number
          campaign_id: string
          clicks: number | null
          created_at: string
          date: string
          id: string
          impressions: number | null
          notes: string | null
          platform: string | null
        }
        Insert: {
          amount?: number
          campaign_id: string
          clicks?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          notes?: string | null
          platform?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string
          clicks?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          notes?: string | null
          platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_spend_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          active: boolean
          created_at: string
          cta_link: string | null
          cta_text: string | null
          highlight: string | null
          id: string
          image_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          highlight?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          highlight?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      beauty_appointments: {
        Row: {
          appointment_date: string
          appointment_number: string
          consultation_fee: number
          created_at: string
          id: string
          notes: string | null
          patient_age: number | null
          patient_gender: string | null
          patient_name: string
          patient_phone: string
          payment_method: string
          payment_status: string
          problem_description: string | null
          specialist_id: string
          status: string
          time_slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_number?: string
          consultation_fee?: number
          created_at?: string
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_name: string
          patient_phone: string
          payment_method?: string
          payment_status?: string
          problem_description?: string | null
          specialist_id: string
          status?: string
          time_slot?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_number?: string
          consultation_fee?: number
          created_at?: string
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_name?: string
          patient_phone?: string
          payment_method?: string
          payment_status?: string
          problem_description?: string | null
          specialist_id?: string
          status?: string
          time_slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "beauty_specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beauty_appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_specialists: {
        Row: {
          available: boolean
          created_at: string
          fee: number
          id: string
          image_url: string | null
          name: string
          schedule: string | null
          specialization: string | null
        }
        Insert: {
          available?: boolean
          created_at?: string
          fee?: number
          id?: string
          image_url?: string | null
          name: string
          schedule?: string | null
          specialization?: string | null
        }
        Update: {
          available?: boolean
          created_at?: string
          fee?: number
          id?: string
          image_url?: string | null
          name?: string
          schedule?: string | null
          specialization?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string
          category: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean
          published_at: string | null
          reading_minutes: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          featured: boolean
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          featured?: boolean
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          featured?: boolean
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      category_layouts: {
        Row: {
          active: boolean
          banner_url: string | null
          category_id: string
          created_at: string
          custom_sort: Json | null
          default_view: string
          description: string | null
          id: string
          seo_text: string | null
          show_filters: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          category_id: string
          created_at?: string
          custom_sort?: Json | null
          default_view?: string
          description?: string | null
          id?: string
          seo_text?: string | null
          show_filters?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          category_id?: string
          created_at?: string
          custom_sort?: Json | null
          default_view?: string
          description?: string | null
          id?: string
          seo_text?: string | null
          show_filters?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_layouts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active: boolean
          address: string | null
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_discount: number | null
          min_order_amount: number
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_order_amount?: number
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_order_amount?: number
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          active: boolean
          area: string
          charge: number
          created_at: string
          estimated_time: string | null
          id: string
        }
        Insert: {
          active?: boolean
          area: string
          charge?: number
          created_at?: string
          estimated_time?: string | null
          id?: string
        }
        Update: {
          active?: boolean
          area?: string
          charge?: number
          created_at?: string
          estimated_time?: string | null
          id?: string
        }
        Relationships: []
      }
      diagnostic_labs: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          logo: string | null
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      doctor_appointments: {
        Row: {
          appointment_date: string
          appointment_number: string
          consultation_fee: number
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          patient_age: number | null
          patient_gender: string | null
          patient_name: string
          patient_phone: string
          payment_method: string
          payment_status: string
          problem_description: string | null
          report_url: string | null
          status: string
          time_slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_number?: string
          consultation_fee?: number
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_name: string
          patient_phone: string
          payment_method?: string
          payment_status?: string
          problem_description?: string | null
          report_url?: string | null
          status?: string
          time_slot?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_number?: string
          consultation_fee?: number
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_name?: string
          patient_phone?: string
          payment_method?: string
          payment_status?: string
          problem_description?: string | null
          report_url?: string | null
          status?: string
          time_slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_reviews: {
        Row: {
          approved: boolean
          comment: string | null
          created_at: string
          doctor_id: string
          id: string
          patient_name: string | null
          rating: number
          user_id: string
        }
        Insert: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          patient_name?: string | null
          rating: number
          user_id: string
        }
        Update: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          patient_name?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          available: boolean
          bio: string | null
          bmdc_number: string | null
          chamber_address: string | null
          chamber_map_url: string | null
          chamber_name: string | null
          created_at: string
          designation: string | null
          education: string | null
          experience_years: number | null
          fee: number
          id: string
          image_url: string | null
          languages: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          qualifications: string | null
          schedule: string | null
          slug: string | null
          specialization: string | null
          visit_days: string | null
          visit_time: string | null
        }
        Insert: {
          available?: boolean
          bio?: string | null
          bmdc_number?: string | null
          chamber_address?: string | null
          chamber_map_url?: string | null
          chamber_name?: string | null
          created_at?: string
          designation?: string | null
          education?: string | null
          experience_years?: number | null
          fee?: number
          id?: string
          image_url?: string | null
          languages?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          qualifications?: string | null
          schedule?: string | null
          slug?: string | null
          specialization?: string | null
          visit_days?: string | null
          visit_time?: string | null
        }
        Update: {
          available?: boolean
          bio?: string | null
          bmdc_number?: string | null
          chamber_address?: string | null
          chamber_map_url?: string | null
          chamber_name?: string | null
          created_at?: string
          designation?: string | null
          education?: string | null
          experience_years?: number | null
          fee?: number
          id?: string
          image_url?: string | null
          languages?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          qualifications?: string | null
          schedule?: string | null
          slug?: string | null
          specialization?: string | null
          visit_days?: string | null
          visit_time?: string | null
        }
        Relationships: []
      }
      flash_sale_products: {
        Row: {
          active: boolean
          created_at: string
          discount_percent: number
          ends_at: string | null
          id: string
          medicine_id: string
          sale_price: number | null
          starts_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount_percent?: number
          ends_at?: string | null
          id?: string
          medicine_id: string
          sale_price?: number | null
          starts_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discount_percent?: number
          ends_at?: string | null
          id?: string
          medicine_id?: string
          sale_price?: number | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_products_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: true
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      health_tips: {
        Row: {
          active: boolean
          created_at: string
          description: string
          icon: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          icon?: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          icon?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          id: string
          section_type: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          section_type?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          section_type?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          batch_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          medicine_id: string
          notes: string | null
          purchase_price: number
          quantity: number
          type: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          medicine_id: string
          notes?: string | null
          purchase_price?: number
          quantity?: number
          type?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          medicine_id?: string
          notes?: string | null
          purchase_price?: number
          quantity?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_bookings: {
        Row: {
          address: string
          booking_number: string
          created_at: string
          diagnostic_lab: string | null
          id: string
          items: Json
          notes: string | null
          patient_age: number | null
          patient_gender: string | null
          patient_name: string
          patient_phone: string
          payment_method: string
          payment_status: string
          preferred_date: string
          preferred_time_slot: string
          report_url: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          booking_number?: string
          created_at?: string
          diagnostic_lab?: string | null
          id?: string
          items?: Json
          notes?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_name: string
          patient_phone: string
          payment_method?: string
          payment_status?: string
          preferred_date: string
          preferred_time_slot?: string
          report_url?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          booking_number?: string
          created_at?: string
          diagnostic_lab?: string | null
          id?: string
          items?: Json
          notes?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_name?: string
          patient_phone?: string
          payment_method?: string
          payment_status?: string
          preferred_date?: string
          preferred_time_slot?: string
          report_url?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_packages: {
        Row: {
          active: boolean
          badge: string | null
          badge_color: string | null
          border_color: string | null
          created_at: string
          gradient: string | null
          icon: string | null
          id: string
          name: string
          original_price: number
          price: number
          sort_order: number
          tests: string[]
        }
        Insert: {
          active?: boolean
          badge?: string | null
          badge_color?: string | null
          border_color?: string | null
          created_at?: string
          gradient?: string | null
          icon?: string | null
          id?: string
          name: string
          original_price?: number
          price?: number
          sort_order?: number
          tests?: string[]
        }
        Update: {
          active?: boolean
          badge?: string | null
          badge_color?: string | null
          border_color?: string | null
          created_at?: string
          gradient?: string | null
          icon?: string | null
          id?: string
          name?: string
          original_price?: number
          price?: number
          sort_order?: number
          tests?: string[]
        }
        Relationships: []
      }
      lab_tests: {
        Row: {
          available: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          name_bn: string | null
          original_price: number | null
          price: number
          report_time: string | null
          sample_type: string | null
        }
        Insert: {
          available?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          name_bn?: string | null
          original_price?: number | null
          price?: number
          report_time?: string | null
          sample_type?: string | null
        }
        Update: {
          available?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          name_bn?: string | null
          original_price?: number | null
          price?: number
          report_time?: string | null
          sample_type?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          campaign: string
          content: string | null
          created_at: string
          end_date: string | null
          id: string
          medium: string
          name: string
          notes: string | null
          source: string
          start_date: string | null
          status: string
          term: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          campaign?: string
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          medium?: string
          name: string
          notes?: string | null
          source?: string
          start_date?: string | null
          status?: string
          term?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          campaign?: string
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          medium?: string
          name?: string
          notes?: string | null
          source?: string
          start_date?: string | null
          status?: string
          term?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketing_visits: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_hash: string | null
          landing_page: string | null
          os: string | null
          referrer: string | null
          session_id: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          os?: string | null
          referrer?: string | null
          session_id: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          os?: string | null
          referrer?: string | null
          session_id?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      medicines: {
        Row: {
          b2b_price: number | null
          category_id: string | null
          company: string | null
          created_at: string
          delivery_time: string | null
          description: string | null
          dosage_form: string | null
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          name_bn: string | null
          original_price: number | null
          price: number
          requires_prescription: boolean
          slug: string | null
          stock: number
          strength: string | null
          updated_at: string
        }
        Insert: {
          b2b_price?: number | null
          category_id?: string | null
          company?: string | null
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          dosage_form?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          name_bn?: string | null
          original_price?: number | null
          price?: number
          requires_prescription?: boolean
          slug?: string | null
          stock?: number
          strength?: string | null
          updated_at?: string
        }
        Update: {
          b2b_price?: number | null
          category_id?: string | null
          company?: string | null
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          dosage_form?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          name_bn?: string | null
          original_price?: number | null
          price?: number
          requires_prescription?: boolean
          slug?: string | null
          stock?: number
          strength?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_campaigns: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          recipient_count: number
          segment_filter: Json | null
          segment_type: string
          sent_by: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          recipient_count?: number
          segment_filter?: Json | null
          segment_type?: string
          sent_by?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          recipient_count?: number
          segment_filter?: Json | null
          segment_type?: string
          sent_by?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          campaign_id: string | null
          clicked_at: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          order_id: string
          price: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_logs: {
        Row: {
          changed_by: string | null
          changed_by_role: string | null
          created_at: string
          id: string
          new_status: string
          note: string | null
          order_id: string
          previous_status: string | null
        }
        Insert: {
          changed_by?: string | null
          changed_by_role?: string | null
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          order_id: string
          previous_status?: string | null
        }
        Update: {
          changed_by?: string | null
          changed_by_role?: string | null
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          order_id?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: string
          delivery_charge: number
          delivery_zone_id: string | null
          device_type: string | null
          first_visit_id: string | null
          id: string
          last_visit_id: string | null
          prescription_id: string | null
          status: string
          total_amount: number
          tracking_status: string | null
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          delivery_address: string
          delivery_charge?: number
          delivery_zone_id?: string | null
          device_type?: string | null
          first_visit_id?: string | null
          id?: string
          last_visit_id?: string | null
          prescription_id?: string | null
          status?: string
          total_amount?: number
          tracking_status?: string | null
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          delivery_address?: string
          delivery_charge?: number
          delivery_zone_id?: string | null
          device_type?: string | null
          first_visit_id?: string | null
          id?: string
          last_visit_id?: string | null
          prescription_id?: string | null
          status?: string
          total_amount?: number
          tracking_status?: string | null
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_first_visit_id_fkey"
            columns: ["first_visit_id"]
            isOneToOne: false
            referencedRelation: "marketing_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_last_visit_id_fkey"
            columns: ["last_visit_id"]
            isOneToOne: false
            referencedRelation: "marketing_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          order_id: string
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: string
          order_id: string
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          order_id?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          id: string
          image_url: string
          notes: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          notes?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_cards: {
        Row: {
          action_link: string | null
          action_text: string | null
          active: boolean
          bg_class: string | null
          created_at: string
          detail: string | null
          highlight: string | null
          icon: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          action_link?: string | null
          action_text?: string | null
          active?: boolean
          bg_class?: string | null
          created_at?: string
          detail?: string | null
          highlight?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Update: {
          action_link?: string | null
          action_text?: string | null
          active?: boolean
          bg_class?: string | null
          created_at?: string
          detail?: string | null
          highlight?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          device_info: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          device_info?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          device_info?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          medicine_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          medicine_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          medicine_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_applications: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_assignments: {
        Row: {
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          order_id: string
          picked_up_at: string | null
          rider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          picked_up_at?: string | null
          rider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          picked_up_at?: string | null
          rider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_assignments_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_deposit_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          created_at: string
          id: string
          rider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          created_at?: string
          id?: string
          rider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          created_at?: string
          id?: string
          rider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_deposit_requests_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          rider_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          rider_id: string
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          rider_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_wallet_transactions_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          rider_id: string
          total_deposited: number
          total_earned: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          rider_id: string
          total_deposited?: number
          total_earned?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          rider_id?: string
          total_deposited?: number
          total_earned?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_wallets_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_addresses: {
        Row: {
          address: string
          address_type: string
          created_at: string
          delivery_charge: number
          district: string
          division: string
          id: string
          is_default: boolean
          name: string
          phone: string
          upazila: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          address_type?: string
          created_at?: string
          delivery_charge?: number
          district: string
          division: string
          id?: string
          is_default?: boolean
          name: string
          phone: string
          upazila?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          address_type?: string
          created_at?: string
          delivery_charge?: number
          district?: string
          division?: string
          id?: string
          is_default?: boolean
          name?: string
          phone?: string
          upazila?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      stock_notifications: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          notified: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          notified?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          notified?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          designation: string
          email: string | null
          id: string
          image_url: string | null
          name: string
          phone: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          designation?: string
          email?: string | null
          id?: string
          image_url?: string | null
          name: string
          phone?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          designation?: string
          email?: string | null
          id?: string
          image_url?: string | null
          name?: string
          phone?: string | null
          sort_order?: number
          updated_at?: string
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_marketing_data: { Args: never; Returns: undefined }
      cleanup_stale_sessions: { Args: never; Returns: undefined }
      get_category_band_products: {
        Args: { cat_names: string[] }
        Returns: {
          b2b_price: number
          category_id: string
          category_name: string
          company: string
          image_url: string
          name: string
          original_price: number
          price: number
          product_id: string
          requires_prescription: boolean
          slug: string
          stock: number
        }[]
      }
      get_homepage_stats: { Args: never; Returns: Json }
      get_top_brands: {
        Args: { lim?: number }
        Returns: {
          count: number
          name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: {
        Args: { coupon_id: string }
        Returns: undefined
      }
      search_medicines: {
        Args: { cat_id?: string; lim?: number; off?: number; q: string }
        Returns: {
          category_id: string
          company: string
          delivery_time: string
          id: string
          image_url: string
          name: string
          name_bn: string
          original_price: number
          price: number
          requires_prescription: boolean
          stock: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user" | "b2b" | "rider"
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
      app_role: ["admin", "user", "b2b", "rider"],
    },
  },
} as const
