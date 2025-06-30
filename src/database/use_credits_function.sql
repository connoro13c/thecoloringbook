-- Create use_credits function for secure credit deduction
CREATE OR REPLACE FUNCTION use_credits(user_uuid UUID, credit_count INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credit balance with row lock
    SELECT credits INTO current_credits 
    FROM user_credits 
    WHERE user_id = user_uuid 
    FOR UPDATE;
    
    -- If user doesn't exist, return false
    IF current_credits IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has enough credits
    IF current_credits < credit_count THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits
    UPDATE user_credits 
    SET 
        credits = credits - credit_count,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION use_credits(UUID, INTEGER) TO authenticated;
