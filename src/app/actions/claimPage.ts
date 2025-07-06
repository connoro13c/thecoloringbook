'use server'

import { createClient } from '@/lib/supabase/server'

export async function claimPage(pageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Only update rows that are still anonymous (user_id is null)
  const { error } = await supabase
    .from('pages')
    .update({ user_id: user.id })
    .eq('id', pageId)
    .is('user_id', null)

  if (error) throw error

  return { success: true }
}
