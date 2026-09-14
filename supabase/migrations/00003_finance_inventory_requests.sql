-- Migration 00003: Accountant Finance, Product Requests, and Inventory Management Tables

-- 1. Financial Documents Table (Accountant Console Module)
CREATE TABLE IF NOT EXISTS financial_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    vendor_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL CHECK (total > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Draft', 'Pending', 'Submitted', 'Approved', 'Rejected', 'Cancelled')),
    admin_remarks TEXT,
    pdf_url TEXT,
    created_by UUID NOT NULL REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Product Requests Table
CREATE TABLE IF NOT EXISTS product_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_code VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    required_date DATE NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    reason TEXT,
    attachment_url TEXT,
    requested_by UUID NOT NULL REFERENCES employees(id),
    reviewed_by UUID REFERENCES employees(id),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected', 'Ordered', 'Partially Received', 'Received', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Site Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    opening_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
    received_qty NUMERIC(12,3) NOT NULL DEFAULT 0,
    transferred_in_qty NUMERIC(12,3) NOT NULL DEFAULT 0,
    used_qty NUMERIC(12,3) NOT NULL DEFAULT 0,
    damaged_qty NUMERIC(12,3) NOT NULL DEFAULT 0,
    unwanted_qty NUMERIC(12,3) NOT NULL DEFAULT 0,
    transferred_out_qty NUMERIC(12,3) NOT NULL DEFAULT 0,
    min_stock_level NUMERIC(12,3) NOT NULL DEFAULT 10,
    unit VARCHAR(50) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, product_id)
);

-- 4. Immutable Inventory Transactions Audit Log
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(12,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('Opening Stock', 'Purchase', 'Material Received', 'Material Used', 'Damaged', 'Unwanted', 'Transfer In', 'Transfer Out', 'Stock Adjustment', 'Return')),
    reference_id UUID,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Material Usage Records
CREATE TABLE IF NOT EXISTS material_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_used NUMERIC(12,3) NOT NULL CHECK (quantity_used > 0),
    unit VARCHAR(50) NOT NULL,
    activity VARCHAR(255) NOT NULL,
    usage_date DATE NOT NULL,
    used_by UUID NOT NULL REFERENCES employees(id),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Damaged Materials Records
CREATE TABLE IF NOT EXISTS damaged_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    damage_date DATE NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    reported_by UUID NOT NULL REFERENCES employees(id),
    status VARCHAR(50) DEFAULT 'Reported' CHECK (status IN ('Reported', 'Approved', 'Rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Unwanted / Excess Materials Records
CREATE TABLE IF NOT EXISTS unwanted_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    photo_url TEXT,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Material Transfers Between Sites
CREATE TABLE IF NOT EXISTS material_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_code VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    from_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    to_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'In Transit', 'Received', 'Cancelled')),
    requested_by UUID NOT NULL REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    received_by UUID REFERENCES employees(id),
    transfer_date DATE NOT NULL,
    received_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply automatic timestamp trigger to new tables
CREATE TRIGGER set_timestamp_financial_documents BEFORE UPDATE ON financial_documents FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_product_requests BEFORE UPDATE ON product_requests FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_inventory BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_material_transfers BEFORE UPDATE ON material_transfers FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
