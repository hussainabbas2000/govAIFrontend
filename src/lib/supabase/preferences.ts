import { supabase } from './client'

const DUMMY_USER_ID = '9baae838-e422-4c29-8430-39991c1a000e'

export async function getPreferences(userId: string = DUMMY_USER_ID) {
  const { data, error } = await supabase
    .from('preferences')
    .select('opportunity_type, location, interested_departments')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updatePreferences(
  updates: Partial<{
    opportunity_type: string
    location: string
    interested_departments: string
  }>,
  userId: string = DUMMY_USER_ID
) {
  const { data, error } = await supabase
    .from('preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
