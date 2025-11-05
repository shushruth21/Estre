-- ===============================================
-- ORDERS AND JOB CARDS SYSTEM
-- ===============================================

-- Create order status enum
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'draft', 'pending', 'confirmed', 'production', 'quality_check',
    'ready_for_delivery', 'shipped', 'delivered', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create payment status enum
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'advance_paid', 'fully_paid', 'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =======================
-- TABLE: ORDERS
-- =======================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number text UNIQUE NOT NULL,
  
  -- Customer info
  customer_id uuid REFERENCES auth.users(id),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address jsonb NOT NULL,
  
  -- Order status
  status order_status DEFAULT 'pending',
  
  -- Pricing
  subtotal_rs numeric NOT NULL,
  discount_code text,
  discount_amount_rs numeric DEFAULT 0,
  net_total_rs numeric NOT NULL,
  
  -- Payment
  payment_status payment_status DEFAULT 'pending',
  advance_percent numeric DEFAULT 50.0,
  advance_amount_rs numeric DEFAULT 0,
  balance_amount_rs numeric GENERATED ALWAYS AS (net_total_rs - advance_amount_rs) STORED,
  
  -- Admin actions
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  admin_notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- =======================
-- TABLE: ORDER_ITEMS
-- =======================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid,
  product_category text NOT NULL,
  product_title text NOT NULL,
  quantity integer DEFAULT 1,
  
  -- Complete configuration
  configuration jsonb NOT NULL,
  
  -- Pricing
  unit_price_rs numeric NOT NULL,
  total_price_rs numeric NOT NULL,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Create job card status enum
DO $$ BEGIN
  CREATE TYPE job_card_status AS ENUM (
    'pending', 'fabric_cutting', 'frame_assembly', 'upholstery',
    'finishing', 'quality_check', 'completed', 'on_hold', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create priority enum
DO $$ BEGIN
  CREATE TYPE job_card_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =======================
-- TABLE: JOB_CARDS
-- =======================
CREATE TABLE IF NOT EXISTS job_cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_number text UNIQUE NOT NULL,
  
  -- Order reference
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES order_items(id),
  order_number text NOT NULL,
  
  -- Customer info (denormalized for staff access)
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address jsonb NOT NULL,
  
  -- Product info
  product_category text NOT NULL,
  product_title text NOT NULL,
  configuration jsonb NOT NULL,
  
  -- Technical specifications for production
  fabric_codes jsonb NOT NULL,
  fabric_meters jsonb NOT NULL,
  accessories jsonb DEFAULT '{}',
  dimensions jsonb NOT NULL,
  
  -- Staff assignment
  assigned_to uuid REFERENCES auth.users(id),
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz,
  
  -- Production workflow
  status job_card_status DEFAULT 'pending',
  priority job_card_priority DEFAULT 'normal',
  
  -- Timeline
  expected_completion_date date,
  actual_start_date date,
  actual_completion_date date,
  
  -- Notes
  admin_notes text,
  staff_notes text,
  
  -- Quality check
  quality_approved boolean DEFAULT false,
  quality_approved_by uuid REFERENCES auth.users(id),
  quality_approved_at timestamptz,
  quality_issues text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_cards_order ON job_cards(order_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_assigned ON job_cards(assigned_to);
CREATE INDEX IF NOT EXISTS idx_job_cards_number ON job_cards(job_card_number);
CREATE INDEX IF NOT EXISTS idx_job_cards_priority ON job_cards(priority);

-- Create task status enum
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create task type enum
DO $$ BEGIN
  CREATE TYPE task_type AS ENUM (
    'fabric_cutting', 'frame_work', 'upholstery', 'assembly',
    'finishing', 'quality_check', 'packaging'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =======================
-- TABLE: JOB_CARD_TASKS
-- =======================
CREATE TABLE IF NOT EXISTS job_card_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id uuid REFERENCES job_cards(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  task_type task_type,
  status task_status DEFAULT 'pending',
  sort_order integer DEFAULT 0,
  assigned_to uuid REFERENCES auth.users(id),
  started_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_card_tasks_job_card ON job_card_tasks(job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_status ON job_card_tasks(status);
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_assigned ON job_card_tasks(assigned_to);

-- =======================
-- TABLE: STAFF_ACTIVITY_LOG
-- =======================
CREATE TABLE IF NOT EXISTS staff_activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id uuid REFERENCES auth.users(id),
  staff_name text NOT NULL,
  job_card_id uuid REFERENCES job_cards(id),
  job_card_number text,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_activity_log_staff ON staff_activity_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_log_job_card ON staff_activity_log(job_card_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_log_created ON staff_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Orders
CREATE POLICY "Customers create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers read own orders" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admin read all orders" ON orders
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager', 'sales_executive', 'production_manager')
  );

CREATE POLICY "Admin update orders" ON orders
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager', 'production_manager')
  );

-- RLS Policies for Order Items
CREATE POLICY "Customers read own order items" ON order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

-- RLS Policies for Job Cards (Staff see ONLY assigned)
CREATE POLICY "Staff read assigned job cards" ON job_cards
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'factory_staff'
    AND assigned_to = auth.uid()
  );

CREATE POLICY "Staff update assigned job cards" ON job_cards
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'factory_staff'
    AND assigned_to = auth.uid()
  );

CREATE POLICY "Admin full access job cards" ON job_cards
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager', 'production_manager')
  );

-- RLS Policies for Tasks
CREATE POLICY "Staff read own job card tasks" ON job_card_tasks
  FOR SELECT USING (
    job_card_id IN (
      SELECT id FROM job_cards WHERE assigned_to = auth.uid()
    )
  );

CREATE POLICY "Staff update own tasks" ON job_card_tasks
  FOR UPDATE USING (
    job_card_id IN (
      SELECT id FROM job_cards WHERE assigned_to = auth.uid()
    )
  );

CREATE POLICY "Admin full access tasks" ON job_card_tasks
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager', 'production_manager')
  );

-- RLS Policies for Activity Log
CREATE POLICY "Staff insert activity logs" ON staff_activity_log
  FOR INSERT WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Admin read all activity logs" ON staff_activity_log
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager', 'production_manager')
  );

-- Triggers for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_cards_updated_at BEFORE UPDATE ON job_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();