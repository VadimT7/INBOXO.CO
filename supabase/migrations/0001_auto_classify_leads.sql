CREATE OR REPLACE FUNCTION classify_lead_status_func()
RETURNS TRIGGER AS $$
BEGIN
    -- Default to 'Cold'
    NEW.status := 'Cold';

    -- Check for 'Hot' keywords
    IF NEW.subject ILIKE '%urgent%' OR NEW.subject ILIKE '%ready to start%' THEN
        NEW.status := 'Hot';
    -- Check for 'Warm' keywords if not already 'Hot'
    ELSIF NEW.subject ILIKE '%budget%' THEN
        NEW.status := 'Warm';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid errors during re-creation
DROP TRIGGER IF EXISTS auto_classify_on_insert ON leads;

-- Create the trigger
CREATE TRIGGER auto_classify_on_insert
BEFORE INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION classify_lead_status_func(); 