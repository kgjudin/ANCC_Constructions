-- Function to automatically update timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to main tables
CREATE TRIGGER set_timestamp_companies BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_roles BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_employees BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_attendance BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_leave_requests BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_suppliers BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_purchases BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER set_timestamp_expenses BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- Function for Atomic Leave Request Approval
CREATE OR REPLACE FUNCTION approve_leave_request(
    p_leave_request_id UUID,
    p_approver_employee_id UUID
) RETURNS VOID AS $$
DECLARE
    v_req RECORD;
    v_balance RECORD;
BEGIN
    SELECT * INTO v_req FROM leave_requests WHERE id = p_leave_request_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Leave request not found';
    END IF;
    
    IF v_req.status != 'Pending' THEN
        RAISE EXCEPTION 'Only pending leave requests can be approved';
    END IF;

    -- Fetch current employee leave balance for the year of start_date
    SELECT * INTO v_balance FROM employee_leave_balances
    WHERE employee_id = v_req.employee_id 
      AND leave_type_id = v_req.leave_type_id
      AND year = EXTRACT(YEAR FROM v_req.start_date)
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Leave balance record not found for this employee and year';
    END IF;

    IF v_balance.remaining_days < v_req.total_days THEN
        RAISE EXCEPTION 'Insufficient leave balance. Remaining: %, Requested: %', v_balance.remaining_days, v_req.total_days;
    END IF;

    -- Deduct remaining days and increase used days atomically
    UPDATE employee_leave_balances
    SET used_days = used_days + v_req.total_days,
        remaining_days = remaining_days - v_req.total_days
    WHERE id = v_balance.id;

    -- Update request status
    UPDATE leave_requests
    SET status = 'Approved',
        approved_by = p_approver_employee_id,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_leave_request_id;
END;
$$ LANGUAGE plpgsql;
