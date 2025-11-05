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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
