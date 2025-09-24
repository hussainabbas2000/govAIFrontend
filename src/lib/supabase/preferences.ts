// lib/supabase/preferences.ts
import { supabase } from './client'

export interface UserPreferences {
  opportunityType: 'product' | 'service' | 'product/service' | '' ;
  location: string;
  interestedDepartments: string;
}

const DUMMY_USER_ID = '9baae838-e422-4c29-8430-39991c1a000e';

export async function getPreferences(userId: string = DUMMY_USER_ID): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('preferences')
    .select('opportunity_type, location, interested_departments')
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  // 🔑 Map snake_case → camelCase
  return {
    opportunityType: data.opportunity_type || 'none',
    location: data.location || '',
    interestedDepartments: data.interested_departments || '',
  };
}

export async function updatePreferences(
  updates: Partial<UserPreferences>,
  userId: string = DUMMY_USER_ID
): Promise<UserPreferences> {
  const mappedUpdates: any = {};
  if (updates.opportunityType !== undefined) mappedUpdates.opportunity_type = updates.opportunityType;
  if (updates.location !== undefined) mappedUpdates.location = updates.location;
  if (updates.interestedDepartments !== undefined) mappedUpdates.interested_departments = updates.interestedDepartments;

  const { data, error } = await supabase
    .from('preferences')
    .update(mappedUpdates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    opportunityType: data.opportunity_type,
    location: data.location,
    interestedDepartments: data.interested_departments,
  };
}
