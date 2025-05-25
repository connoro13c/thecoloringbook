import { NextResponse } from 'next/server';
import { createClient } from '@/lib/auth-server';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  
  return { user, error: null };
}