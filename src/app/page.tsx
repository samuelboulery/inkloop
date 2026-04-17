import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getWorkspaces } from '@/features/workspaces/server/getWorkspaces'

export default async function RootPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const workspaces = await getWorkspaces()

  if (workspaces.length === 0) redirect('/onboarding')

  redirect(`/${workspaces[0].id}`)
}
