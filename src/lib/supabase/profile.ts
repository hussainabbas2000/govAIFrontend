import { supabase } from './client'

export async function getCurrentUserProfile() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw authError || new Error('Not logged in')

  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, full_name,
      preferences (opportunity_type, location, interested_departments)
    `)
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

export async function updatePreferences(updates: {
  opportunity_type?: string
  location?: string
  interested_departments?: string
}) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw authError || new Error('Not logged in')

  const { data, error } = await supabase
    .from('preferences')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}
