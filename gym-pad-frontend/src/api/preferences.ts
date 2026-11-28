import { supabase } from '@/util/supabase'
import type { Preferences } from '@/types/preferences'

const PREFERENCE_COLUMNS = 'show_rest_timer'

export const DEFAULT_PREFERENCES: Preferences = { show_rest_timer: true }

export async function getPreferences(): Promise<Preferences | null> {
    const { data, error } = await supabase.from('user_preferences').select(PREFERENCE_COLUMNS).maybeSingle()
    if (error) throw error
    return data
}

export async function savePreferences(changes: Partial<Preferences>): Promise<void> {
    const userIdIsFilledInByDatabaseDefault = changes
    const { error } = await supabase
        .from('user_preferences')
        .upsert(userIdIsFilledInByDatabaseDefault, { onConflict: 'user_id' })
    if (error) throw error
}
