import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's pages AND unclaimed pages with claim tokens (for debugging)
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .or(`user_id.eq.${user.id},and(user_id.is.null,claim_token.not.is.null)`)
    .order('created_at', { ascending: false })

  return (
    <DashboardClient 
      initialPages={pages || []} 
      userEmail={user.email || ''} 
    />
  )
}
