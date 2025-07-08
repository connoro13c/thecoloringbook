-- Create use_credits function for secure credit deduction
CREATE OR REPLACE FUNCTION use_credits(user_uuid UUID, credit_count INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_credits INTEGER;
    user_exists BOOLEAN;
BEGIN
    -- Validate input parameters
    IF user_uuid IS NULL OR credit_count IS NULL OR credit_count <= 0 THEN
        RAISE WARNING 'Invalid input parameters: user_uuid=%, credit_count=%', user_uuid, credit_count;
        RETURN FALSE;
    END IF;
    
    -- Prevent excessive credit usage in a single transaction
    IF credit_count > 10 THEN
        RAISE WARNING 'Excessive credit usage attempt: user=%, credits=%', user_uuid, credit_count;
        RETURN FALSE;
    END IF;
    
    -- Check if user exists first
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_uuid) INTO user_exists;
    IF NOT user_exists THEN
        RAISE WARNING 'User does not exist: %', user_uuid;
        RETURN FALSE;
    END IF;
    
    -- Get current credit balance with row lock (prevents race conditions)
    SELECT credits INTO current_credits 
    FROM user_credits 
    WHERE user_id = user_uuid 
    FOR UPDATE;
    
    -- If user credit record doesn't exist, return false
    IF current_credits IS NULL THEN
        RAISE WARNING 'No credit record found for user: %', user_uuid;
        RETURN FALSE;
    END IF;
    
    -- Check if user has enough credits
    IF current_credits < credit_count THEN
        RAISE NOTICE 'Insufficient credits: user=%, available=%, requested=%', user_uuid, current_credits, credit_count;
        RETURN FALSE;
    END IF;
    
    -- Deduct credits atomically
    UPDATE user_credits 
    SET 
        credits = credits - credit_count,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Log successful credit usage
    RAISE NOTICE 'Credits deducted: user=%, amount=%, remaining=%', user_uuid, credit_count, (current_credits - credit_count);
    
    RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION use_credits(UUID, INTEGER) TO authenticated;
