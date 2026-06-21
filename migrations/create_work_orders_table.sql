-- Create Ruzgar_Work_Orders table
CREATE TABLE IF NOT EXISTS public."Ruzgar_Work_Orders" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_no VARCHAR(50) NOT NULL UNIQUE,
  product VARCHAR(255) NOT NULL,
  product_size VARCHAR(255),
  customer VARCHAR(255) NOT NULL,
  order_no VARCHAR(255),
  material VARCHAR(255) NOT NULL,
  machine VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on work_order_no for faster lookups
CREATE INDEX IF NOT EXISTS idx_work_orders_work_order_no 
ON public."Ruzgar_Work_Orders"(work_order_no DESC);

-- Create index on created_at for date-based queries
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at 
ON public."Ruzgar_Work_Orders"(created_at DESC);

-- Enable RLS
ALTER TABLE public."Ruzgar_Work_Orders" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all operations (same as other Ruzgar tables)
CREATE POLICY "Allow all operations on work_orders" 
ON public."Ruzgar_Work_Orders" 
FOR ALL 
USING (true) 
WITH CHECK (true);
