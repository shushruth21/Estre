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
      accessories: {
        Row: {
          code: string
          compatible_categories: string[] | null
          created_at: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          metadata: Json | null
          price_rs: number
          title: string
          type: Database["public"]["Enums"]["accessory_type"]
          updated_at: string | null
        }
        Insert: {
          code: string
          compatible_categories?: string[] | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          metadata?: Json | null
          price_rs: number
          title: string
          type: Database["public"]["Enums"]["accessory_type"]
          updated_at?: string | null
        }
        Update: {
          code?: string
          compatible_categories?: string[] | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          metadata?: Json | null
          price_rs?: number
          title?: string
          type?: Database["public"]["Enums"]["accessory_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      accessories_prices: {
        Row: {
          created_at: string | null
          description: string
          id: string
          images: string | null
          is_active: boolean | null
          markup_percentage: number | null
          our_cost: number | null
          sale_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percentage?: number | null
          our_cost?: number | null
          sale_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percentage?: number | null
          our_cost?: number | null
          sale_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      arm_chairs_admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      arm_chairs_database: {
        Row: {
          adjusted_bom_rs: number | null
          bom_rs: number | null
          created_at: string | null
          discount_percent: number | null
          discount_rs: number | null
          fabric_additional_chair_mtrs: number | null
          fabric_single_chair_mtrs: number | null
          id: string
          images: string | null
          is_active: boolean | null
          markup_percent: number | null
          net_markup_1seater: number | null
          net_price_rs: number | null
          strike_price_1seater_rs: number | null
          title: string
          updated_at: string | null
          wastage_delivery_gst_percent: number | null
          wastage_delivery_gst_rs: number | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_chair_mtrs?: number | null
          fabric_single_chair_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_chair_mtrs?: number | null
          fabric_single_chair_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title?: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Relationships: []
      }
      bed_admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      bed_database: {
        Row: {
          adjusted_bom_rs: number | null
          bom_rs: number | null
          created_at: string | null
          discount_percent: number | null
          discount_rs: number | null
          fabric_bed_queen_above_mtrs: number | null
          fabric_bed_up_to_double_xl_mtrs: number | null
          id: string
          images: string | null
          is_active: boolean | null
          length_beyond_mattress_in: number | null
          markup_percent: number | null
          net_markup: number | null
          net_price_single_no_storage_rs: number | null
          strike_price_rs: number | null
          title: string
          updated_at: string | null
          wastage_delivery_gst_percent: number | null
          wastage_delivery_gst_rs: number | null
          width_beyond_mattress_in: number | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_bed_queen_above_mtrs?: number | null
          fabric_bed_up_to_double_xl_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          length_beyond_mattress_in?: number | null
          markup_percent?: number | null
          net_markup?: number | null
          net_price_single_no_storage_rs?: number | null
          strike_price_rs?: number | null
          title: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
          width_beyond_mattress_in?: number | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_bed_queen_above_mtrs?: number | null
          fabric_bed_up_to_double_xl_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          length_beyond_mattress_in?: number | null
          markup_percent?: number | null
          net_markup?: number | null
          net_price_single_no_storage_rs?: number | null
          strike_price_rs?: number | null
          title?: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
          width_beyond_mattress_in?: number | null
        }
        Relationships: []
      }
      benches_admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      benches_database: {
        Row: {
          adjusted_bom_rs: number | null
          bom_rs: number | null
          created_at: string | null
          discount_percent: number | null
          discount_rs: number | null
          fabric_additional_seat_mtrs: number | null
          fabric_single_bench_mtrs: number | null
          id: string
          images: string | null
          is_active: boolean | null
          markup_percent: number | null
          net_markup_1seater: number | null
          net_price_rs: number | null
          strike_price_1seater_rs: number | null
          title: string
          updated_at: string | null
          wastage_delivery_gst_percent: number | null
          wastage_delivery_gst_rs: number | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_single_bench_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_single_bench_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title?: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Relationships: []
      }
      cinema_chairs_admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      cinema_chairs_database: {
        Row: {
          adjusted_bom_rs: number | null
          bom_electric_wtf_only: number | null
          created_at: string | null
          discount_percent: number | null
          discount_rs: number | null
          fabric_additional_seat_mtrs: number | null
          fabric_armrest_mtrs: number | null
          fabric_console_10_mtrs: number | null
          fabric_console_6_mtrs: number | null
          fabric_first_seat_mtrs: number | null
          id: string
          images: string | null
          is_active: boolean | null
          markup_percent: number | null
          net_markup_1seater_single_motor: number | null
          net_price_rs: number | null
          strike_price_1seater_rs: number | null
          title: string
          updated_at: string | null
          wastage_delivery_gst_percent: number | null
          wastage_delivery_gst_rs: number | null
          whether_comes_with_headrest: string | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          bom_electric_wtf_only?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_armrest_mtrs?: number | null
          fabric_console_10_mtrs?: number | null
          fabric_console_6_mtrs?: number | null
          fabric_first_seat_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater_single_motor?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
          whether_comes_with_headrest?: string | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          bom_electric_wtf_only?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_armrest_mtrs?: number | null
          fabric_console_10_mtrs?: number | null
          fabric_console_6_mtrs?: number | null
          fabric_first_seat_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater_single_motor?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title?: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
          whether_comes_with_headrest?: string | null
        }
        Relationships: []
      }
      customer_orders: {
        Row: {
          calculated_price: number | null
          configuration: Json
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          fabric_total_meters: number | null
          id: string
          notes: string | null
          order_number: string
          product_id: string | null
          product_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          calculated_price?: number | null
          configuration: Json
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          fabric_total_meters?: number | null
          id?: string
          notes?: string | null
          order_number: string
          product_id?: string | null
          product_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          calculated_price?: number | null
          configuration?: Json
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          fabric_total_meters?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          product_id?: string | null
          product_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dining_chairs_admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      dining_chairs_database: {
        Row: {
          adjusted_bom_rs: number | null
          bom_rs: number | null
          created_at: string | null
          discount_percent: number | null
          discount_rs: number | null
          fabric_additional_chair_mtrs: number | null
          fabric_single_chair_mtrs: number | null
          id: string
          images: string | null
          is_active: boolean | null
          markup_percent: number | null
          net_markup_1seater: number | null
          net_price_rs: number | null
          strike_price_1seater_rs: number | null
          title: string
          updated_at: string | null
          wastage_delivery_gst_percent: number | null
          wastage_delivery_gst_rs: number | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_chair_mtrs?: number | null
          fabric_single_chair_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_chair_mtrs?: number | null
          fabric_single_chair_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title?: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Relationships: []
      }
      dropdown_options: {
        Row: {
          category: string
          created_at: string | null
          display_label: string | null
          field_name: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          option_value: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          display_label?: string | null
          field_name: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          option_value: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          display_label?: string | null
          field_name?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          option_value?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fabric_coding: {
        Row: {
          bom_price: number | null
          brand: string | null
          collection: string | null
          colour: string | null
          colour_link: string | null
          created_at: string | null
          description: string | null
          estre_code: string
          id: string
          is_active: boolean | null
          price: number | null
          updated_at: string | null
          upgrade: number | null
          vendor: string | null
          vendor_code: string | null
        }
        Insert: {
          bom_price?: number | null
          brand?: string | null
          collection?: string | null
          colour?: string | null
          colour_link?: string | null
          created_at?: string | null
          description?: string | null
          estre_code: string
          id?: string
          is_active?: boolean | null
          price?: number | null
          updated_at?: string | null
          upgrade?: number | null
          vendor?: string | null
          vendor_code?: string | null
        }
        Update: {
          bom_price?: number | null
          brand?: string | null
          collection?: string | null
          colour?: string | null
          colour_link?: string | null
          created_at?: string | null
          description?: string | null
          estre_code?: string
          id?: string
          is_active?: boolean | null
          price?: number | null
          updated_at?: string | null
          upgrade?: number | null
          vendor?: string | null
          vendor_code?: string | null
        }
        Relationships: []
      }
      fabrics: {
        Row: {
          category: string | null
          code: string
          color_family: string | null
          created_at: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          material: string | null
          metadata: Json | null
          price_per_mtr_rs: number
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          color_family?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          material?: string | null
          metadata?: Json | null
          price_per_mtr_rs: number
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          color_family?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          material?: string | null
          metadata?: Json | null
          price_per_mtr_rs?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_card_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          job_card_id: string | null
          notes: string | null
          sort_order: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_name: string
          task_type: Database["public"]["Enums"]["task_type"] | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          job_card_id?: string | null
          notes?: string | null
          sort_order?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_name: string
          task_type?: Database["public"]["Enums"]["task_type"] | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          job_card_id?: string | null
          notes?: string | null
          sort_order?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_name?: string
          task_type?: Database["public"]["Enums"]["task_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_card_tasks_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      job_cards: {
        Row: {
          accessories: Json | null
          actual_completion_date: string | null
          actual_start_date: string | null
          admin_notes: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          configuration: Json
          created_at: string | null
          customer_name: string
          customer_phone: string
          delivery_address: Json
          dimensions: Json
          expected_completion_date: string | null
          fabric_codes: Json
          fabric_meters: Json
          id: string
          job_card_number: string
          order_id: string | null
          order_item_id: string | null
          order_number: string
          priority: Database["public"]["Enums"]["job_card_priority"] | null
          product_category: string
          product_title: string
          quality_approved: boolean | null
          quality_approved_at: string | null
          quality_approved_by: string | null
          quality_issues: string | null
          staff_notes: string | null
          status: Database["public"]["Enums"]["job_card_status"] | null
          updated_at: string | null
        }
        Insert: {
          accessories?: Json | null
          actual_completion_date?: string | null
          actual_start_date?: string | null
          admin_notes?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          configuration: Json
          created_at?: string | null
          customer_name: string
          customer_phone: string
          delivery_address: Json
          dimensions: Json
          expected_completion_date?: string | null
          fabric_codes: Json
          fabric_meters: Json
          id?: string
          job_card_number: string
          order_id?: string | null
          order_item_id?: string | null
          order_number: string
          priority?: Database["public"]["Enums"]["job_card_priority"] | null
          product_category: string
          product_title: string
          quality_approved?: boolean | null
          quality_approved_at?: string | null
          quality_approved_by?: string | null
          quality_issues?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["job_card_status"] | null
          updated_at?: string | null
        }
        Update: {
          accessories?: Json | null
          actual_completion_date?: string | null
          actual_start_date?: string | null
          admin_notes?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          configuration?: Json
          created_at?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: Json
          dimensions?: Json
          expected_completion_date?: string | null
          fabric_codes?: Json
          fabric_meters?: Json
          id?: string
          job_card_number?: string
          order_id?: string | null
          order_item_id?: string | null
          order_number?: string
          priority?: Database["public"]["Enums"]["job_card_priority"] | null
          product_category?: string
          product_title?: string
          quality_approved?: boolean | null
          quality_approved_at?: string | null
          quality_approved_by?: string | null
          quality_issues?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["job_card_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_cards_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_bed_admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      kids_bed_database: {
        Row: {
          adjusted_bom_rs: number | null
          bom_rs: number | null
          created_at: string | null
          discount_percent: number | null
          discount_rs: number | null
          fabric_bed_queen_above_mtrs: number | null
          fabric_bed_up_to_double_xl_mtrs: number | null
          id: string
          images: string | null
          is_active: boolean | null
          length_beyond_mattress_in: number | null
          markup_percent: number | null
          net_markup: number | null
          net_price_single_no_storage_rs: number | null
          strike_price_rs: number | null
          title: string
          updated_at: string | null
          wastage_delivery_gst_percent: number | null
          wastage_delivery_gst_rs: number | null
          width_beyond_mattress_in: number | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_bed_queen_above_mtrs?: number | null
          fabric_bed_up_to_double_xl_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          length_beyond_mattress_in?: number | null
          markup_percent?: number | null
          net_markup?: number | null
          net_price_single_no_storage_rs?: number | null
          strike_price_rs?: number | null
          title: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
          width_beyond_mattress_in?: number | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_bed_queen_above_mtrs?: number | null
          fabric_bed_up_to_double_xl_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          length_beyond_mattress_in?: number | null
          markup_percent?: number | null
          net_markup?: number | null
          net_price_single_no_storage_rs?: number | null
          strike_price_rs?: number | null
          title?: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
          width_beyond_mattress_in?: number | null
        }
        Relationships: []
      }
      legs_prices: {
        Row: {
          cost_per_unit: number | null
          created_at: string | null
          description: string
          id: string
          images: string | null
          is_active: boolean | null
          markup_percentage: number | null
          price_per_unit: number | null
          size: string | null
          updated_at: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string | null
          description: string
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percentage?: number | null
          price_per_unit?: number | null
          size?: string | null
          updated_at?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string | null
          description?: string
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percentage?: number | null
          price_per_unit?: number | null
          size?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          configuration: Json
          created_at: string | null
          id: string
          order_id: string | null
          product_category: string
          product_id: string | null
          product_title: string
          quantity: number | null
          total_price_rs: number
          unit_price_rs: number
        }
        Insert: {
          configuration: Json
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_category: string
          product_id?: string | null
          product_title: string
          quantity?: number | null
          total_price_rs: number
          unit_price_rs: number
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_category?: string
          product_id?: string | null
          product_title?: string
          quantity?: number | null
          total_price_rs?: number
          unit_price_rs?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          advance_amount_rs: number | null
          advance_percent: number | null
          approved_at: string | null
          approved_by: string | null
          balance_amount_rs: number | null
          created_at: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_address: Json
          discount_amount_rs: number | null
          discount_code: string | null
          id: string
          metadata: Json | null
          net_total_rs: number
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal_rs: number
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          advance_amount_rs?: number | null
          advance_percent?: number | null
          approved_at?: string | null
          approved_by?: string | null
          balance_amount_rs?: number | null
          created_at?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_address: Json
          discount_amount_rs?: number | null
          discount_code?: string | null
          id?: string
          metadata?: Json | null
          net_total_rs: number
          order_number: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal_rs: number
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          advance_amount_rs?: number | null
          advance_percent?: number | null
          approved_at?: string | null
          approved_by?: string | null
          balance_amount_rs?: number | null
          created_at?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: Json
          discount_amount_rs?: number | null
          discount_code?: string | null
          id?: string
          metadata?: Json | null
          net_total_rs?: number
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal_rs?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_formulas: {
        Row: {
          applies_to: Json | null
          calculation_type: Database["public"]["Enums"]["calculation_type"]
          category: string
          created_at: string | null
          description: string | null
          formula_name: string
          id: string
          is_active: boolean | null
          unit: Database["public"]["Enums"]["formula_unit"] | null
          updated_at: string | null
          value: number
        }
        Insert: {
          applies_to?: Json | null
          calculation_type: Database["public"]["Enums"]["calculation_type"]
          category: string
          created_at?: string | null
          description?: string | null
          formula_name: string
          id?: string
          is_active?: boolean | null
          unit?: Database["public"]["Enums"]["formula_unit"] | null
          updated_at?: string | null
          value: number
        }
        Update: {
          applies_to?: Json | null
          calculation_type?: Database["public"]["Enums"]["calculation_type"]
          category?: string
          created_at?: string | null
          description?: string | null
          formula_name?: string
          id?: string
          is_active?: boolean | null
          unit?: Database["public"]["Enums"]["formula_unit"] | null
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          adjusted_bom_rs: number | null
          available_armrest_types: string[] | null
          bom_rs: number
          category: Database["public"]["Enums"]["product_category"]
          comes_with_headrest: boolean | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          fabric_requirements: Json | null
          id: string
          images: string[] | null
          is_active: boolean | null
          markup_percent: number | null
          metadata: Json | null
          net_price_rs: number | null
          strike_price_rs: number | null
          title: string
          updated_at: string | null
          wastage_percent: number | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          available_armrest_types?: string[] | null
          bom_rs: number
          category: Database["public"]["Enums"]["product_category"]
          comes_with_headrest?: boolean | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          fabric_requirements?: Json | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          markup_percent?: number | null
          metadata?: Json | null
          net_price_rs?: number | null
          strike_price_rs?: number | null
          title: string
          updated_at?: string | null
          wastage_percent?: number | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          available_armrest_types?: string[] | null
          bom_rs?: number
          category?: Database["public"]["Enums"]["product_category"]
          comes_with_headrest?: boolean | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          fabric_requirements?: Json | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          markup_percent?: number | null
          metadata?: Json | null
          net_price_rs?: number | null
          strike_price_rs?: number | null
          title?: string
          updated_at?: string | null
          wastage_percent?: number | null
        }
        Relationships: []
      }
      recliner_admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      recliner_database: {
        Row: {
          adjusted_bom_rs: number | null
          created_at: string | null
          discount_percent: number | null
          discount_rs: number | null
          fabric_additional_seat_mtrs: number | null
          fabric_backrest_mtrs: number | null
          fabric_console_10_mtrs: number | null
          fabric_console_6_mtrs: number | null
          fabric_corner_mtrs: number | null
          fabric_first_recliner_mtrs: number | null
          id: string
          images: string | null
          is_active: boolean | null
          manual_bom: number | null
          markup_percent: number | null
          net_markup_1seater_manual: number | null
          net_price_rs: number | null
          strike_price_1seater_rs: number | null
          title: string
          updated_at: string | null
          wastage_delivery_gst_percent: number | null
          wastage_delivery_gst_rs: number | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_backrest_mtrs?: number | null
          fabric_console_10_mtrs?: number | null
          fabric_console_6_mtrs?: number | null
          fabric_corner_mtrs?: number | null
          fabric_first_recliner_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          manual_bom?: number | null
          markup_percent?: number | null
          net_markup_1seater_manual?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_backrest_mtrs?: number | null
          fabric_console_10_mtrs?: number | null
          fabric_console_6_mtrs?: number | null
          fabric_corner_mtrs?: number | null
          fabric_first_recliner_mtrs?: number | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          manual_bom?: number | null
          markup_percent?: number | null
          net_markup_1seater_manual?: number | null
          net_price_rs?: number | null
          strike_price_1seater_rs?: number | null
          title?: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Relationships: []
      }
      sofa_admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      sofa_database: {
        Row: {
          adjusted_bom_rs: number | null
          backrest: string | null
          backrest_depth: number | null
          bom_rs: number | null
          comes_with_headrest: string | null
          created_at: string | null
          discount_percent: number | null
          discount_rs: number | null
          fabric_additional_seat_mtrs: number | null
          fabric_backrest_mtrs: number | null
          fabric_console_10_mtrs: number | null
          fabric_console_6_mtrs: number | null
          fabric_corner_seat_mtrs: number | null
          fabric_first_seat_mtrs: number | null
          fabric_lounger_6ft_mtrs: number | null
          fabric_lounger_additional_6_mtrs: number | null
          headrest: string | null
          id: string
          images: string | null
          is_active: boolean | null
          markup_percent: number | null
          net_markup_1seater: number | null
          net_price_rs: number | null
          seat: string | null
          strike_price_1seater_rs: number | null
          structare: string | null
          title: string
          updated_at: string | null
          wastage_delivery_gst_percent: number | null
          wastage_delivery_gst_rs: number | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          backrest?: string | null
          backrest_depth?: number | null
          bom_rs?: number | null
          comes_with_headrest?: string | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_backrest_mtrs?: number | null
          fabric_console_10_mtrs?: number | null
          fabric_console_6_mtrs?: number | null
          fabric_corner_seat_mtrs?: number | null
          fabric_first_seat_mtrs?: number | null
          fabric_lounger_6ft_mtrs?: number | null
          fabric_lounger_additional_6_mtrs?: number | null
          headrest?: string | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          seat?: string | null
          strike_price_1seater_rs?: number | null
          structare?: string | null
          title: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          backrest?: string | null
          backrest_depth?: number | null
          bom_rs?: number | null
          comes_with_headrest?: string | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_backrest_mtrs?: number | null
          fabric_console_10_mtrs?: number | null
          fabric_console_6_mtrs?: number | null
          fabric_corner_seat_mtrs?: number | null
          fabric_first_seat_mtrs?: number | null
          fabric_lounger_6ft_mtrs?: number | null
          fabric_lounger_additional_6_mtrs?: number | null
          headrest?: string | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          seat?: string | null
          strike_price_1seater_rs?: number | null
          structare?: string | null
          title?: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Relationships: []
      }
      sofabed_admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      sofabed_database: {
        Row: {
          adjusted_bom_rs: number | null
          backrest: string | null
          backrest_depth: number | null
          bom_rs: number | null
          comes_with_headrest: string | null
          created_at: string | null
          discount_percent: number | null
          discount_rs: number | null
          fabric_additional_seat_mtrs: number | null
          fabric_backrest_mtrs: number | null
          fabric_console_10_mtrs: number | null
          fabric_console_6_mtrs: number | null
          fabric_corner_seat_mtrs: number | null
          fabric_first_seat_mtrs: number | null
          fabric_lounger_6ft_mtrs: number | null
          fabric_lounger_additional_6_mtrs: number | null
          headrest: string | null
          id: string
          images: string | null
          is_active: boolean | null
          markup_percent: number | null
          net_markup_1seater: number | null
          net_price_rs: number | null
          seat: string | null
          strike_price_1seater_rs: number | null
          structare: string | null
          title: string
          updated_at: string | null
          wastage_delivery_gst_percent: number | null
          wastage_delivery_gst_rs: number | null
        }
        Insert: {
          adjusted_bom_rs?: number | null
          backrest?: string | null
          backrest_depth?: number | null
          bom_rs?: number | null
          comes_with_headrest?: string | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_backrest_mtrs?: number | null
          fabric_console_10_mtrs?: number | null
          fabric_console_6_mtrs?: number | null
          fabric_corner_seat_mtrs?: number | null
          fabric_first_seat_mtrs?: number | null
          fabric_lounger_6ft_mtrs?: number | null
          fabric_lounger_additional_6_mtrs?: number | null
          headrest?: string | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          seat?: string | null
          strike_price_1seater_rs?: number | null
          structare?: string | null
          title: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Update: {
          adjusted_bom_rs?: number | null
          backrest?: string | null
          backrest_depth?: number | null
          bom_rs?: number | null
          comes_with_headrest?: string | null
          created_at?: string | null
          discount_percent?: number | null
          discount_rs?: number | null
          fabric_additional_seat_mtrs?: number | null
          fabric_backrest_mtrs?: number | null
          fabric_console_10_mtrs?: number | null
          fabric_console_6_mtrs?: number | null
          fabric_corner_seat_mtrs?: number | null
          fabric_first_seat_mtrs?: number | null
          fabric_lounger_6ft_mtrs?: number | null
          fabric_lounger_additional_6_mtrs?: number | null
          headrest?: string | null
          id?: string
          images?: string | null
          is_active?: boolean | null
          markup_percent?: number | null
          net_markup_1seater?: number | null
          net_price_rs?: number | null
          seat?: string | null
          strike_price_1seater_rs?: number | null
          structare?: string | null
          title?: string
          updated_at?: string | null
          wastage_delivery_gst_percent?: number | null
          wastage_delivery_gst_rs?: number | null
        }
        Relationships: []
      }
      staff_activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          job_card_id: string | null
          job_card_number: string | null
          staff_id: string | null
          staff_name: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          job_card_id?: string | null
          job_card_number?: string | null
          staff_id?: string | null
          staff_name: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          job_card_id?: string | null
          job_card_number?: string | null
          staff_id?: string | null
          staff_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_activity_log_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      accessory_type: "leg" | "armrest" | "console" | "pillow" | "other"
      calculation_type: "percentage" | "flat_rate" | "multiplier"
      formula_unit: "percent" | "rupees" | "multiplier"
      job_card_priority: "low" | "normal" | "high" | "urgent"
      job_card_status:
        | "pending"
        | "fabric_cutting"
        | "frame_assembly"
        | "upholstery"
        | "finishing"
        | "quality_check"
        | "completed"
        | "on_hold"
        | "cancelled"
      order_status:
        | "draft"
        | "pending"
        | "confirmed"
        | "production"
        | "quality_check"
        | "ready_for_delivery"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "advance_paid" | "fully_paid" | "refunded"
      product_category:
        | "sofa"
        | "sofa_bed"
        | "recliner"
        | "cinema_chair"
        | "bed"
        | "kids_bed"
        | "dining_chair"
        | "arm_chair"
        | "pouffe"
        | "bench"
      task_status: "pending" | "in_progress" | "completed" | "skipped"
      task_type:
        | "fabric_cutting"
        | "frame_work"
        | "upholstery"
        | "assembly"
        | "finishing"
        | "quality_check"
        | "packaging"
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
      accessory_type: ["leg", "armrest", "console", "pillow", "other"],
      calculation_type: ["percentage", "flat_rate", "multiplier"],
      formula_unit: ["percent", "rupees", "multiplier"],
      job_card_priority: ["low", "normal", "high", "urgent"],
      job_card_status: [
        "pending",
        "fabric_cutting",
        "frame_assembly",
        "upholstery",
        "finishing",
        "quality_check",
        "completed",
        "on_hold",
        "cancelled",
      ],
      order_status: [
        "draft",
        "pending",
        "confirmed",
        "production",
        "quality_check",
        "ready_for_delivery",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "advance_paid", "fully_paid", "refunded"],
      product_category: [
        "sofa",
        "sofa_bed",
        "recliner",
        "cinema_chair",
        "bed",
        "kids_bed",
        "dining_chair",
        "arm_chair",
        "pouffe",
        "bench",
      ],
      task_status: ["pending", "in_progress", "completed", "skipped"],
      task_type: [
        "fabric_cutting",
        "frame_work",
        "upholstery",
        "assembly",
        "finishing",
        "quality_check",
        "packaging",
      ],
    },
  },
} as const
